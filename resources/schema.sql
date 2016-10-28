create table user (
  id                int not null auto_increment,
  first_name        varchar(255) not null,
  last_name         varchar(255) not null,
  email             varchar(255) default null,
  username          varchar(255) default null,
  biography         varchar(255) default null,
  facebook_account  varchar(255) not null,
  facebook_picture  varchar(255) default null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_user_username` (`username`),
  unique key `uq_user_email` (`email`),
  unique key `uq_user_facebook_account` (`facebook_account`)
) engine = innodb default charset = utf8;

create table contest (
  id                  int not null auto_increment,
  name                varchar(255) not null,
  description         varchar(255) default null,
  image               varchar(255) default null,
  slug                varchar(255) not null,
  start_date          timestamp null default null,
  end_date            timestamp null default null,
  registration_date   timestamp not null default current_timestamp,
  minimum_contestants tinyint default null,
  primary key (id),
  unique key `uq_contest_slug` (`slug`)
) engine = innodb default charset = utf8;

create table contest_winner (
  contest_id int not null,
  user_id    int not null,
  place      tinyint not null,
  unique key `uq_contest_winner_contest_id_user_id` (`contest_id`, `user_id`),
  unique key `uq_contest_winner_contest_id_place` (`contest_id`, `place`),
  key `fk_contest_winner_contest_id` (`contest_id`),
  key `fk_contest_winner_user_id` (`user_id`),
  constraint `fk_contest_winner_contest_id` foreign key (`contest_id`) references `contest` (`id`),
  constraint `fk_contest_winner_user_id` foreign key (`user_id`) references `user` (`id`)
) engine = innodb default charset = utf8;

create table video (
  id                int not null auto_increment,
  user_id           int not null,
  contest_id        int not null,
  title             varchar(255) not null,
  slug              varchar(255) not null,
  url               varchar(255) not null,
  small_thumbnail   varchar(255) default null,
  medium_thumbnail  varchar(255) default null,
  large_thumbnail   varchar(255) default null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_video_url` (`url`),
  unique key `uq_video_contest_id_user_id` (`contest_id`, `user_id`),
  key `fk_video_user_id` (`user_id`),
  key `fk_video_contest_id` (`contest_id`),
  constraint `fk_video_user_id` foreign key (`user_id`) references `user` (`id`),
  constraint `fk_video_contest_id` foreign key (`contest_id`) references `contest` (`id`)
) engine = innodb default charset = utf8;

create table user_like (
  user_id           int not null,
  video_id          int not null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_user_like_user_id_video_id` (`user_id`, `video_id`),
  key `fk_user_like_user_id` (`user_id`),
  key `fk_user_like_video_id` (`video_id`),
  constraint `fk_user_like_user_id` foreign key (`user_id`) references `user` (`id`),
  constraint `fk_user_like_video_id` foreign key (`video_id`) references `video` (`id`)
) engine = innodb default charset = utf8;

create table comment (
  id                int not null auto_increment,
  user_id           int not null,
  video_id          int not null,
  comment_id        int default null,
  message           text not null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  key `fk_comment_user_id` (`user_id`),
  key `fk_comment_video_id` (`video_id`),
  key `fk_comment_comment_id` (`comment_id`),
  constraint `fk_comment_user_id` foreign key (`user_id`) references `user` (`id`),
  constraint `fk_comment_video_id` foreign key (`video_id`) references `video` (`id`),
  constraint `fk_comment_comment_id` foreign key (`comment_id`) references `comment` (`id`)
) engine = innodb default charset = utf8;

create table fan (
  id                int not null auto_increment,
  user_id           int not null,
  related_id        int not null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_fan_user_id_related_id` (`user_id`, `related_id`),
  key `fk_fan_user_id` (`user_id`),
  key `fk_fan_related_id` (`related_id`),
  constraint `fk_fan_user_id` foreign key (`user_id`) references `user` (`id`),
  constraint `fk_fan_related_id` foreign key (`related_id`) references `user` (`id`)
) engine = innodb default charset = utf8;

create table prize (
  id         int not null auto_increment,
  name       varchar(255) not null,
  place      tinyint not null,
  image      varchar(255) default null,
  contest_id int not null,
  primary key (id),
  key `fk_prize_contest_id` (`contest_id`),
  constraint `fk_prize_contest_id` foreign key (`contest_id`) references `contest` (`id`)
) engine = innodb default charset = utf8;