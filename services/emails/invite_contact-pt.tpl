{% extends "base.tpl" %}

{% block title %}{{ user.first_name }} convidou você para participar do círculo {{ circle.name }}{% endblock %}

{% block content %}
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td class="content-block">
      Você conhece o aplicativo Cover Academy?
    </td>
  </tr>
  <tr>
    <td class="content-block">
      Cuide das pessoas que você ama. Cover Academy é o melhor aplicativo para ficar ainda mais próximo da sua família e amigos. Saiba se eles estão seguros e seja alertado no caso de perigo.
    </td>
  </tr>
  <tr>
    <td class="content-block aligncenter">
      <a href="{{ website }}/{{ language }}" class="btn-primary">Saiba mais sobre o Cover Academy</a>
    </td>
  </tr>
  <tr>
    <td class="content-block">
      Baixe o aplicativo para responder a este convite.
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