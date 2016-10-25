'use strict';

var settings       = require('../configs/settings'),
    logger         = require('../configs/logger'),
    userService    = require('../apis/userService'),
    circleService  = require('../apis/circleService'),
    commons        = require('../apis/internals/commons'),
    messages       = require('../apis/internals/messages'),
    cryptography   = require('../utils/cryptography'),
    titles         = require('./emails/titles.json'),
    util           = require('util'),
    restify        = require('restify'),
    nunjucks       = require('nunjucks'),
    juice          = require('juice'),
    path           = require('path'),
    fs             = require('fs'),
    rimraf         = require('rimraf'),
    mkdirp         = require('mkdirp'),
    Promise        = require('bluebird'),
    Mailgun        = require('mailgun-js'),
    _              = require('lodash'),
    contact        = settings.postman.contact,
    mailgun        = new Mailgun({apiKey: settings.postman.apiKey, domain: settings.domain});

var server = restify.createServer({
  name: 'Postman'
});

server.use(restify.queryParser());
server.use(restify.bodyParser());

var RESET_PASSWORD_REQUEST_TEMPLATE = 'reset_password_request';
var VERIFY_EMAIL_REQUEST_TEMPLATE = 'verify_email_request';
var INVITE_CONTACT_TEMPLATE = 'invite_contact';

var templatesDir = path.join(__dirname, 'emails');
var inlineTemplatesDir = path.join(templatesDir, 'inline');

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(inlineTemplatesDir));
env.addGlobal('website', settings.website);
env.addFilter('encrypt', function(value) {
  return cryptography.encrypt(value);
});

var templates = {};
rimraf.sync(inlineTemplatesDir);
mkdirp.sync(inlineTemplatesDir);
fs.readdirSync(templatesDir).forEach(function(templateName) {
  if(_.endsWith(templateName, 'tpl')) {
    var template = fs.readFileSync(path.join(templatesDir, templateName));
    var css = fs.readFileSync(path.join(templatesDir, 'css/styles.css'));
    var inlineTemplate = juice.inlineContent(template.toString(), css.toString());
    fs.writeFileSync(path.join(inlineTemplatesDir, templateName), inlineTemplate);

    templates[templateName.replace('.tpl', '')] = env.getTemplate(templateName);
  }
});

var getTemplate = function(templateName, language) {
  if(!language) {
    language = 'en';
  }
  var template = templates[templateName + '-' + language];
  if(!template) {
    language = 'en';
    template = templates[templateName + '-' + language];
    if(!template) {
      throw messages.apiError('email.template.doesNotExist', 'Email template "' + templateName + '" in language "' + language + '" does not exist');
    }
  }
  return template;
};

var getTemplateTitle = function(templateName, language, parameters) {
  var title = titles[templateName];
  if(!title) {
    throw messages.apiError('email.title.doesNotExist', 'Email title of template "' + templateName + '" does not exist');
  }
  if(!language || !title[language]) {
    language = 'en';
  }
  if(!title[language]) {
    throw messages.apiError('email.title.translationNotFound', 'Email title of template "' + templateName + '" does not exist in language "' + language + '"');
  }
  if(parameters) {
    parameters.unshift(title[language]);
    return util.format.apply(this, parameters);
  } else {
    return title[language];
  }
};

var renderPromise = function(template, obj) {
  return new Promise(function(resolve, reject) {
    template.render(obj, function(err, email) {
      if(err) {
        reject(err);
      } else {
        resolve(email);
      }
    });
  });
};

var receive = function(fromName, from, subject, text) {
  return new Promise(function(resolve, reject) {
    mailgun.messages().send({from: fromName + ' <' + from + '>', to: contact, subject: subject, html: text}, function (err, body) {
      if(err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
};

var send = function(to, subject, text) {
  return new Promise(function(resolve, reject) {
    mailgun.messages().send({from: 'Cover Academy <' + contact + '>', to: to, subject: subject, html: text}, function (err, body) {
      if(err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
};

server.post('/receive', function(req, res, next) {
  receive(req.body.fromName, req.body.from, req.body.subject, req.body.text).then(function() {
    res.send(200);
  }).catch(function(err) {
    res.send(500);
  });
});

server.post('/send', function(req, res, next) {
  send(req.body.to, req.body.subject, req.body.text).then(function() {
    res.send(200);
  }).catch(function(err) {
    res.send(500);
  });
});

server.post('/password/resetRequest', function(req, res, next) {
  userService.getUser(req.body.user).bind({}).then(function(user) {
    this.user = user;
    this.language = commons.getLanguage(this.user.get('language'));
    this.template = getTemplate(RESET_PASSWORD_REQUEST_TEMPLATE, this.language);
    this.templateTitle = getTemplateTitle(RESET_PASSWORD_REQUEST_TEMPLATE, this.language);
    return renderPromise(this.template, {user: this.user.toJSON(), language: this.language});
  }).then(function(email) {
    return send(this.user.get('email'), this.templateTitle, email);
  }).then(function() {
    res.send(200);
  }).catch(function(err) {
    logger.error('Error sending "reset password request" email to user %d', this.user.id, err);
    res.send(500);
  });
});

server.post('/email/verifyRequest', function(req, res, next) {
  userService.getUser(req.body.user).bind({}).then(function(user) {
    this.user = user;
    this.language = commons.getLanguage(this.user.get('language'));
    this.template = getTemplate(VERIFY_EMAIL_REQUEST_TEMPLATE, this.language);
    this.templateTitle = getTemplateTitle(VERIFY_EMAIL_REQUEST_TEMPLATE, this.language);
    return renderPromise(this.template, {user: this.user.toJSON(), language: this.language});
  }).then(function(email) {
    return send(this.user.get('email'), this.templateTitle, email);
  }).then(function() {
    res.send(200);
  }).catch(function(err) {
    logger.error('Error sending "verify email request" email to user %d', this.user.id, err);
    res.send(500);
  });
});

server.post('/contacts/invite', function(req, res, next) {
  circleService.getInvitation(req.body.invitation, true).bind({}).then(function(invitation) {
    this.guestEmail = commons.getGuestInformation(invitation, 'email');
    if(!this.guestEmail) {
      res.send(200);
      return;
    }
    this.user = invitation.related('user');
    this.circle = invitation.related('circle');
    this.language = commons.getLanguage(this.user.get('language'));
    this.template = getTemplate(INVITE_CONTACT_TEMPLATE, this.language);
    this.templateTitle = getTemplateTitle(INVITE_CONTACT_TEMPLATE, this.language, [this.user.get('first_name'), this.circle.get('name')]);
    return renderPromise(this.template, {circle: this.circle.toJSON(), user: this.user.toJSON(), language: this.language});
  }).then(function(email) {
    return send(this.guestEmail, this.templateTitle, email);
  }).then(function() {
    res.send(200);
  }).catch(function(err) {
    logger.error('Error sending "invitation" email to user %d', this.user.id, err);
    res.send(500);
  });
});

server.listen(settings.postman.port, function() {
  logger.info('%s listening at %s', server.name, server.url);
});