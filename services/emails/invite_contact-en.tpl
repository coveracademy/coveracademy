{% extends "base.tpl" %}

{% block title %}{{ user.first_name }} invited you to join the circle {{ circle.name }}{% endblock %}

{% block content %}
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td class="content-block">
      Do you known the Cover Academy app?
    </td>
  </tr>
  <tr>
    <td class="content-block">
      Take care of the people you love. Cover Academy is the best app to get even closer to your family and friends. Find out if they are safe and to be alerted in case of danger.
    </td>
  </tr>
  <tr>
    <td class="content-block aligncenter">
      <a href="{{ website }}/{{ language }}" class="btn-primary">Learn more about Cover Academy</a>
    </td>
  </tr>
  <tr>
    <td class="content-block">
      Download the app to respond this invitation.
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