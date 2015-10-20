{% extends "base.tpl" %}

{% block title %}Reset your password{% endblock %}

{% block content %}
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td class="content-block">
      You've requested a password reset. To proceed simply click in the button below.
    </td>
  </tr>
  <tr>
    <td class="content-block aligncenter">
      <a href="{{ website }}/{{ language }}/reset-password/{{ user.email | encrypt }}" class="btn-primary">Reset password</a>
    </td>
  </tr>
  <tr>
    <td class="content-block">
      If you didn't request this email or you don't want to reset your password anymore, simply disregard. Nothing will change in your account settings, and your account will remain secure.
    </td>
  </tr>
  <tr>
    <td class="content-block">
      Sincerely,<br/>
      The Cover Academy team
    </td>
  </tr>
</table>
{% endblock %}