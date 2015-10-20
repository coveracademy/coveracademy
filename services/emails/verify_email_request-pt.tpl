{% extends "base.tpl" %}

{% block title %}Verifique o seu email{% endblock %}

{% block content %}
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td class="content-block">
      Olá {{ user.first_name }},
    </td>
  </tr>
  <tr>
    <td class="content-block">
      É muito importante verificar o seu endereço de email. Isso permite que sua família e seus amigos certifiquem que esta conta é realmente sua.
    </td>
  </tr>
  <tr>
    <td class="content-block aligncenter">
      <a href="{{ website }}/{{ language }}/verify-email/{{ user.email | encrypt }}" class="btn-primary">Verificar email</a>
    </td>
  </tr>
  <tr>
    <td class="content-block">
      Atenciosamente,<br/>
      Equipe Cover Academy
    </td>
  </tr>
</table>
{% endblock %}