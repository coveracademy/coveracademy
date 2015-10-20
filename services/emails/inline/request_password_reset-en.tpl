{% extends "base.tpl" %}

{% block title %}Reset your password{% endblock }

{% block content %}
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
  <tr style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
    <td class="content-block" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; padding: 0 0 20px;">
      You've requested a password reset. To proceed please follow this link:
    </td>
  </tr>
  <tr style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
    <td class="content-block" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; padding: 0 0 20px;">
      <a href="{{ website }}" class="btn-primary" style="margin: 0; box-sizing: border-box; font-size: 14px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #FFF; text-decoration: none; background-color: #348eda; border: solid #348eda; text-transform: capitalize; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; border-width: 10px 20px;">Reset password</a>
    </td>
  </tr>
  <tr style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
    <td class="content-block" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; padding: 0 0 20px;">
      If you didn't request this email or you don't want to reset your password anymore, simply disregard. Nothing will change in your account settings, and your account will remain secure.
    </td>
  </tr>
  <tr style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
    <td class="content-block" style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; padding: 0 0 20px;">
      Sincerely,<br style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px;">
      The Cover Academy Team
    </td>
  </tr>
</table>
{% endblock %}