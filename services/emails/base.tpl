<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>{% block title %}{% endblock %}</title>
    <link href="styles.css" media="all" rel="stylesheet" type="text/css" />
  </head>
  <body itemscope itemtype="http://schema.org/EmailMessage">
    <table class="body-wrap">
      <tr>
        <td></td>
        <td class="container" width="600">
          <div class="content">
            <table class="main" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="alert alert-neutral">
                  <h2>{% block title %}{% endblock %}</h2>
                </td>
              </tr>
              <tr>
                <td class="content-wrap">
                  {% block content %}
                  {% endblock %}
                </td>
              </tr>
              <tr>
                <td class="alert alert-social alert-bottom">
                  <a href="https://www.facebook.com/coveracademy" target="_blank">
                    <img src="{{ website }}/img/facebook.png" height="60">
                  </a>
                  <a href="https://www.twitter.com/Cover AcademyApp" target="_blank">
                    <img src="{{ website }}/img/twitter.png" height="60">
                  </a>
                </td>
              </tr>
            </table>
            <div class="footer">
              <table width="100%">
                <tr>
                  <td class="aligncenter content-block"><a href="http://www.coveracademy.com/unsubscribe">Unsubscribe</a> from these alerts.</td>
                </tr>
              </table>
            </div>
          </div>
        </td>
        <td></td>
      </tr>
    </table>
  </body>
</html>