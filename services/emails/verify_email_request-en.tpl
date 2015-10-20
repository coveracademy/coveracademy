{% extends "base.tpl" %}

{% block title %}Verify your email{% endblock %}

{% block content %}
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td class="content-block">
      Hello {{ user.first_name }},
    </td>
  </tr>
  <tr>
    <td class="content-block">
      It's very important to verify your email address. This allows your family and friends to be sure that this account is really yours.
    </td>
  </tr>
  <tr>
    <td class="content-block aligncenter">
      <a href="{{ website }}/{{ language }}/verify-email/{{ user.email | encrypt }}" class="btn-primary">Verify email</a>
    </td>
  </tr>
  <tr>
    <td class="content-block">
      Sincerely,<br/>
      Cover Academy team
    </td>
  </tr>
</table>
{% endblock %}