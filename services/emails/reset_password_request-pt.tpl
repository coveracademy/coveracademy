{% extends "base.tpl" %}

{% block title %}Resete sua senha{% endblock %}

{% block content %}
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td class="content-block">
      Você solicitou as instruções para redefinir a sua senha. Para proceder basta clicar no botão abaixo.
    </td>
  </tr>
  <tr>
    <td class="content-block aligncenter">
      <a href="{{ website }}/{{ language }}/reset-password/{{ user.email | encrypt }}" class="btn-primary">Resetar senha</a>
    </td>
  </tr>
  <tr>
    <td class="content-block">
      Se você não requisitou este email ou não deseja mais redefinir a sua senha, simplesmente ignore este email. Sua conta não será modificada e continuará segura.
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