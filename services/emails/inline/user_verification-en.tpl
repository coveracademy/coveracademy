{% extends "base.tpl" %}

{% block content %}
  <h3 style="box-sizing: border-box; margin: 40px 0 0; font-family: 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif; font-size: 18px; color: #000; line-height: 1.2em; font-weight: 400;">Por favor, confirme o seu email.</h3>
  <div style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; color: #555; font-size: 16px;">
    <p style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin-bottom: 10px; font-weight: normal;">
      Olá {{ user.name }}, obrigado por fazer parte da nossa comunidade.
    </p>
    <p style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin-bottom: 10px; font-weight: normal;">
      Confirme o seu email para conseguir votar nos competidores e participar das competições de música do Cover Academy.
    </p>
    <div style="margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; text-align: center;">
      <a href="{{ website }}/pt-br/verify?token={{ token }}" style="box-sizing: border-box; margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; border-radius: 6px; color: #fff; background-color: #5bc0de; border-color: #46b8da; display: inline-block; margin-bottom: 0; font-weight: 400; text-align: center; white-space: nowrap; vertical-align: middle; font-size: 18px; touch-action: manipulation; cursor: pointer; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; background-image: none; border: 1px solid transparent; text-decoration: none; padding: 10px 16px; line-height: 1.42857143; -ms-touch-action: manipulation;">
        Confirmar email
      </a>
    </div>
  </div>
{% endblock %}