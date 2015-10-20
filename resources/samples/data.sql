insert into user (id, first_name, last_name, phone, email, password) values (1, "Sandro", "Simas", "+557199999991", "sandro@email.com", "$2a$10$e7kTlnUSZAXsNlwKOans3.3CEdFgZkkPB8uChMe3iWK1lYusWbwtq");
insert into user (id, first_name, last_name, phone, email, password) values (2, "Wesley", "Mascarenhas", "+557199999992", "wesley@email.com", "$2a$10$e7kTlnUSZAXsNlwKOans3.3CEdFgZkkPB8uChMe3iWK1lYusWbwtq");
insert into circle (id, name, creator_id, location_mode) values (1, "Family", 1, "anytime");
insert into circle (id, name, creator_id, location_mode) values (2, "Friends", 2, "anytime");
insert into member (id, circle_id, user_id, permission, location_mode) values (1, 1, 1, "owner", "anytime");
insert into member (id, circle_id, user_id, permission, location_mode) values (2, 1, 2, "user", "anytime");
insert into member (id, circle_id, user_id, permission, location_mode) values (3, 2, 2, "owner", "anytime");
insert into member (id, circle_id, user_id, permission, location_mode) values (4, 2, 1, "user", "anytime");

insert into place (id, type, name, latitude, longitude, radius, circle_id, creator_id) values (1, "place", "Work", -12.973325, -38.481951, 17, 1, 1);
insert into place (id, type, name, latitude, longitude, radius, circle_id, creator_id) values (2, "place", "Home", -12.973325, -38.481951, 17, 1, 1);
insert into place (id, type, name, latitude, longitude, radius, circle_id, creator_id, recurring_event, every_sunday, every_monday, every_tuesday, every_wednesday, every_thursday, every_friday, every_saturday, start_date, end_date) values (3, "event", "Motocross", -12.973325, -38.481951, 17, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, current_timestamp, current_timestamp);