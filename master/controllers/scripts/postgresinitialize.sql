DROP TABLE IF EXISTS colors;
CREATE TABLE IF NOT EXISTS colors (
  name varchar(255) NOT NULL primary key,
  hover varchar(255) NOT NULL,
  verticalbar varchar(255) NOT NULL DEFAULT '#ffffff',
  locked varchar(255) NOT NULL,
  status0 varchar(255) NOT NULL,
  status1 varchar(255) NOT NULL,
  status2 varchar(255) NOT NULL,
  sort varchar(255) NOT NULL,
  barpositive varchar(255) NOT NULL,
  barnegative varchar(255) NOT NULL,
  imputed1 varchar(255) NOT NULL,
  imputed2 varchar(255) NOT NULL,
  barref varchar(255) NOT NULL,
  barbackground varchar(255) NOT NULL,
  bartextleft varchar(255) NOT NULL,
  bartextright varchar(255) NOT NULL,
  hoverstatus2 varchar(255) NOT NULL,
  imputed varchar(255) NOT NULL,
  pos integer NOT NULL
);

INSERT INTO colors (name, hover, verticalbar, locked, status0, status1, status2, sort, barpositive, barnegative, imputed1, imputed2, barref, barbackground, bartextleft, bartextright, hoverstatus2, imputed, pos) VALUES
('aggreset', '#FF6A33', '#ebebeb', '#2F4F4F', '#B1BDC5', '#F4F4F4', '#E6E6E6', '#1D4870', '#B1BDC5', '#1D4870', '#1D4870', '#1D4870', '#DEE2E6', '#DEE2E6', '#000000', '#000000', '#FF6A33', '#1D4870', 0),
('brewer-green-blue', '#1c9099', '#ffffff', '#016c59', '#d0d1e6', '#f6eff7', '#f6eff7', '#67a9cf', '#67a9cf', '#67a9cf', '#67a9cf', '#67a9cf', '#f6eff7', '#f6eff7', '#000000', '#000000', '#67a9cf', '#a6bddb', 2),
('brewer-red-blue', '#b2182b', '#ffffff', '#2166ac', '#ef8a62', '#fddbc7', '#fddbc7', '#d1e5f0', '#d1e5f0', '#67a9cf', '#67a9cf', '#67a9cf', '#fddbc7', '#fddbc7', '#000000', '#000000', '#b2182b', '#67a9cf', 3),
('upset', '#74ADD1', '#FED9A6', '#F46D43', '#636363', '#F0F0F0', '#D3D3D3', '#1D4870', '#74ADD1', '#F46D43', '#1F77B4', '#1F77B4', '#F0F0F0', '#F0F0F0', '#FFFFFF', '#000000', '#74ADD1', '#D3D3D3', 1);

DROP TABLE IF EXISTS datasets;
CREATE TABLE IF NOT EXISTS datasets (
  id serial primary key,
  name varchar(256) NOT NULL,
  temporal smallint NOT NULL,
  attributes text NOT NULL,
  non_info_attrbs text NOT NULL,
  sort text NOT NULL,
  temp_attr text NOT NULL,
  ipaddress varchar(256) NOT NULL
);
