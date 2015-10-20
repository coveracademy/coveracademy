<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
  <head>
    <meta name="viewport" content="width=device-width">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>{% block title %}{% endblock %}</title>
    <link href="styles.css" media="all" rel="stylesheet" type="text/css">
  </head>
  <body itemscope="" itemtype="http://schema.org/EmailMessage" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; height: 100%; line-height: 1.6em; background-color: #f6f6f6; width: 100%;">
    <table class="body-wrap" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; background-color: #f6f6f6; width: 100%;">
      <tr style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
        <td style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top;"></td>
        <td class="container" width="600" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0 auto; display: block; max-width: 600px; clear: both;">
          <div class="content" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0 auto; max-width: 600px; display: block; padding: 20px;">
            <table class="main" width="100%" cellpadding="0" cellspacing="0" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; background-color: #fff; border: 1px solid #e9e9e9; border-radius: 3px;">
              <tr style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
                <td class="alert alert-good" style="margin: 0; box-sizing: border-box; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; vertical-align: top; color: #fff; font-size: 16px; font-weight: 500; padding: 20px; text-align: center; border-radius: 3px 3px 0 0; background-color: #68B90F;">
                  Cover Academy - {% block title %}{% endblock %}
                </td>
              </tr>
              <tr style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
                <td class="content-wrap" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; padding: 20px;">
                  {% block content %}
                  {% endblock %}
                </td>
              </tr>
            </table>
            <div class="footer" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; padding: 20px;">
              <table width="100%" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
                <tr style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
                  <td class="aligncenter content-block" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; vertical-align: top; padding: 0 0 20px; text-align: center; font-size: 12px; color: #999;"><a href="http://www.mailgun.com" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; text-decoration: underline; font-size: 12px; color: #999;">Unsubscribe</a> from these alerts.</td>
                </tr>
              </table>
            </div>
          </div>
        </td>
        <td style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top;"></td>
      </tr>
    </table>
  </body>
</html>