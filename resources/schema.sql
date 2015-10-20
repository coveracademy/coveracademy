create table user (
  id                 int not null auto_increment,
  name               varchar(100) not null,
  email              varchar(255) default null,
  permission         enum('user', 'admin') default 'user',
  gender             enum('male', 'female') default 'male',
  biography          varchar(255) default null,
  username           varchar(255) default null,
  city               varchar(255) default null,
  state              varchar(255) default null,
  facebook_account   varchar(255) not null,
  facebook_picture   varchar(255) default null,
  twitter_account    varchar(255) default null,
  twitter_picture    varchar(255) default null,
  google_account     varchar(255) default null,
  google_picture     varchar(255) default null,
  youtube_account    varchar(255) default null,
  soundcloud_account varchar(255) default null,
  profile_picture    varchar(20) not null,
  voting_power       decimal(6, 3) default 1.000,
  verified           tinyint default 0,
  contestant         tinyint default 0,
  emails_enabled     tinyint default 1,
  registration_date  timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_user_username` (`username`),
  unique key `uq_user_email` (`email`),
  unique key `uq_user_facebook_account` (`facebook_account`),
  unique key `uq_user_twitter_account` (`twitter_account`),
  unique key `uq_user_google_account` (`google_account`),
  unique key `uq_user_youtube_account` (`youtube_account`),
  unique key `uq_user_soundcloud_account` (`soundcloud_account`)
) engine = innodb default charset = utf8;

create table social_account (
  id        int not null auto_increment,
  user_id   int not null,
  network   varchar(100) not null,
  url       varchar(255) default null,
  show_link tinyint default 0,
  primary key (id),
  unique key `uq_social_account_user_id_network` (`user_id`, `network`),
  key `fk_social_account_user_id` (`user_id`),
  constraint `fk_social_account_user_id` foreign key (`user_id`) references `user` (`id`)
) engine = innodb default charset = utf8;

create table music_genre (
  id       int not null auto_increment,
  name     varchar(50) not null,
  slug     varchar(50) not null,
  image    varchar(50) not null,
  i18n_key varchar(50) not null,
  primary key (id),
  unique key `uq_music_genre_name` (`name`),
  unique key `uq_music_genre_i18n_key` (`i18n_key`),
  unique key `uq_music_genre_slug` (`slug`)
) engine = innodb default charset = utf8;

create table artist (
  id                int not null auto_increment,
  name              varchar(100) not null,
  slug              varchar(100) not null,
  music_genre_id    int default null,
  small_thumbnail   varchar(255) default null,
  medium_thumbnail  varchar(255) default null,
  large_thumbnail   varchar(255) default null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_artist_name` (`name`),
  unique key `uq_artist_slug` (`slug`),
  key `fk_artist_music_genre_id` (`music_genre_id`),
  constraint `fk_artist_music_genre_id` foreign key (`music_genre_id`) references `music_genre` (`id`)
) engine = innodb default charset = utf8;

create table music (
  id                int not null auto_increment,
  title             varchar(255) not null,
  slug              varchar(255) not null,
  artist_id         int not null,
  small_thumbnail   varchar(255) default null,
  medium_thumbnail  varchar(255) default null,
  large_thumbnail   varchar(255) default null,
  last_cover_date   timestamp null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_music_slug` (`slug`),
  key `fk_music_artist_id` (`artist_id`),
  constraint `fk_music_artist_id` foreign key (`artist_id`) references `artist` (`id`)
) engine = innodb default charset = utf8;

create table cover (
  id                int not null auto_increment,
  user_id           int not null,
  artist_id         int not null,
  music_id          int not null,
  slug              varchar(255) not null,
  url               varchar(255) not null,
  embed_url         varchar(255) not null,
  author            varchar(255) not null,
  score             decimal(17, 16) not null,
  duration          int not null,
  video_id          varchar(255) not null,
  video_title       varchar(255) not null,
  video_likes       int not null,
  video_dislikes    int not null,
  video_views       int not null,
  video_date        timestamp null default null,
  small_thumbnail   varchar(255) default null,
  medium_thumbnail  varchar(255) default null,
  large_thumbnail   varchar(255) default null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_cover_url` (`url`),
  key `fk_cover_user_id` (`user_id`),
  key `fk_cover_artist_id` (`artist_id`),
  key `fk_cover_music_id` (`music_id`),
  constraint `fk_cover_user_id` foreign key (`user_id`) references `user` (`id`),
  constraint `fk_cover_artist_id` foreign key (`artist_id`) references `artist` (`id`),
  constraint `fk_cover_music_id` foreign key (`music_id`) references `music` (`id`)
) engine = innodb default charset = utf8;

create table potential_cover (
  id                int not null auto_increment,
  artist            varchar(255) not null,
  music             varchar(255) not null,
  author            varchar(255) not null,
  url               varchar(255) not null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_potential_cover_url` (`url`)
) engine = innodb default charset = utf8;

create table contest_modality (
  id    int not null auto_increment,
  name  varchar(255) not null,
  rules text not null,
  primary key (id)
) engine = innodb default charset = utf8;

create table contest (
  id                  int not null auto_increment,
  name                varchar(255) not null,
  description         text default null,
  slug                varchar(255) not null,
  image               varchar(255) not null,
  minimum_contestants tinyint default null,
  acceptance_date     date not null,
  start_date          timestamp null default null,
  end_date            timestamp null default null,
  registration_date   timestamp not null default current_timestamp,
  duration            tinyint not null,
  draw                tinyint default 0,
  active              tinyint default 1,
  progress            varchar(50) default 'waiting',
  modality_id         int default null,
  rules               text default null,
  primary key (id),
  unique key `uq_contest_slug` (`slug`),
  key `fk_contest_modality_id` (`modality_id`),
  constraint `fk_contest_modality_id` foreign key (`modality_id`) references `contest_modality` (`id`)
) engine = innodb default charset = utf8;

create table audition (
  id                int not null auto_increment,
  contest_id        int not null,
  user_id           int not null,
  slug              varchar(255) not null,
  url               varchar(255) not null,
  embed_url         varchar(255) not null,
  video_id          varchar(255) not null,
  title             varchar(255) not null,
  description       text not null,
  small_thumbnail   varchar(255) default null,
  medium_thumbnail  varchar(255) default null,
  large_thumbnail   varchar(255) default null,
  place             tinyint default null,
  approved          tinyint default 0,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_audition_url` (`url`),
  unique key `uq_audition_contest_id_user_id` (`contest_id`, `user_id`),
  key `fk_audition_contest_id` (`contest_id`),
  key `fk_audition_user_id` (`user_id`),
  constraint `fk_audition_contest_id` foreign key (`contest_id`) references `contest` (`id`),
  constraint `fk_audition_user_id` foreign key (`user_id`) references `user` (`id`)
) engine = innodb default charset = utf8;

create table user_vote (
  id                int not null auto_increment,
  user_id           int not null,
  audition_id       int not null,
  voting_power      decimal(6, 3) default 1.000,
  valid             tinyint default 0,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_user_vote_user_id_audition_id` (`user_id`, `audition_id`),
  key `fk_user_vote_user_id` (`user_id`),
  key `fk_user_vote_audition_id` (`audition_id`),
  constraint `fk_user_vote_user_id` foreign key (`user_id`) references `user` (`id`),
  constraint `fk_user_vote_audition_id` foreign key (`audition_id`) references `audition` (`id`)
) engine = innodb default charset = utf8;

create table user_comment (
  id                int not null auto_increment,
  user_id           int not null,
  audition_id       int not null,
  comment_id        int default null,
  message           text not null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  key `fk_user_comment_user_id` (`user_id`),
  key `fk_user_comment_audition_id` (`audition_id`),
  key `fk_user_comment_comment_id` (`comment_id`),
  constraint `fk_user_comment_user_id` foreign key (`user_id`) references `user` (`id`),
  constraint `fk_user_comment_audition_id` foreign key (`audition_id`) references `audition` (`id`),
  constraint `fk_user_comment_comment_id` foreign key (`comment_id`) references `user_comment` (`id`) on delete cascade
) engine = innodb default charset = utf8;

create table user_fan (
  id                int not null auto_increment,
  user_id           int not null,
  fan_id            int not null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  unique key `uq_user_fan_user_id_fan_id` (`user_id`, `fan_id`),
  key `fk_user_fan_user_id` (`user_id`),
  key `fk_user_fan_fan_id` (`fan_id`),
  constraint `fk_user_fan_user_id` foreign key (`user_id`) references `user` (`id`),
  constraint `fk_user_fan_fan_id` foreign key (`fan_id`) references `user` (`id`)
) engine = innodb default charset = utf8;

create table sponsor (
  id                       int not null auto_increment,
  name                     varchar(255) not null,
  logo                     varchar(255) not null,
  website                  varchar(255) not null,
  beginning_of_sponsorship date not null,
  end_of_sponsorship       date not null,
  registration_date        timestamp not null default current_timestamp,
  primary key (id)
) engine = innodb default charset = utf8;

create table sponsor_contest (
  id                int not null auto_increment,
  sponsor_id        int not null,
  contest_id        int not null,
  registration_date timestamp not null default current_timestamp,
  primary key (id),
  key `fk_sponsor_contest_sponsor_id` (`sponsor_id`),
  key `fk_sponsor_contest_contest_id` (`contest_id`),
  constraint `fk_sponsor_contest_sponsor_id` foreign key (`sponsor_id`) references `sponsor` (`id`),
  constraint `fk_sponsor_contest_contest_id` foreign key (`contest_id`) references `contest` (`id`)
) engine = innodb default charset = utf8;

create table prize (
  id          int not null auto_increment,
  contest_id  int not null,
  sponsor_id  int default null,
  place       tinyint not null,
  name        varchar(100) not null,
  full_name   varchar(100) default null,
  description text default null,
  image       varchar(255) default null,
  link        varchar(255) default null,
  primary key (id),
  key `fk_prize_contest_id` (`contest_id`),
  key `fk_prize_sponsor_id` (`sponsor_id`),
  constraint `fk_prize_contest_id` foreign key (`contest_id`) references `contest` (`id`),
  constraint `fk_prize_sponsor_id` foreign key (`sponsor_id`) references `sponsor` (`id`)
) engine = innodb default charset = utf8;

create table scheduled_email (
  id                int not null auto_increment,
  type              varchar(100) not null,
  parameters        text not null,
  status            enum('none', 'scheduled', 'sent') default 'none',
  schedule_date     timestamp not null,
  registration_date timestamp not null default current_timestamp,
  primary key (id)
) engine = innodb default charset = utf8;
