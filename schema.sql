CREATE DATABASE IF NOT EXISTS tools_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tools_api;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  bio VARCHAR(500) DEFAULT '',
  skills JSON DEFAULT (JSON_ARRAY()),
  experience INT UNSIGNED NOT NULL DEFAULT 0,
  organization VARCHAR(255) DEFAULT '',
  industry VARCHAR(255) DEFAULT '',
  wallet_coins DECIMAL(12,2) NOT NULL DEFAULT 0,
  wallet_money DECIMAL(12,2) NOT NULL DEFAULT 0,
  solved_problems JSON DEFAULT (JSON_ARRAY()),
  created_problems JSON DEFAULT (JSON_ARRAY()),
  submitted_solutions JSON DEFAULT (JSON_ARRAY()),
  stats_problems_created INT UNSIGNED NOT NULL DEFAULT 0,
  stats_problems_solved INT UNSIGNED NOT NULL DEFAULT 0,
  stats_success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  reviews JSON DEFAULT (JSON_ARRAY()),
  profile_pic VARCHAR(500) NOT NULL DEFAULT 'default-profile.jpg',
  reset_token VARCHAR(255) NULL,
  reset_token_expiry DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  KEY users_reset_token_idx (reset_token)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tools (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NULL,
  photo VARCHAR(1000) NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('available', 'pending_exchange', 'sold') NOT NULL DEFAULT 'available',
  owner_id BIGINT UNSIGNED NULL,
  buyer_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY tools_owner_idx (owner_id),
  KEY tools_buyer_idx (buyer_id),
  KEY tools_status_idx (status),
  CONSTRAINT tools_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT tools_buyer_fk FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problems (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  reward_type ENUM('money', 'coins') NOT NULL,
  reward_amount DECIMAL(12,2) NOT NULL,
  deadline DATETIME NULL,
  tags JSON DEFAULT (JSON_ARRAY()),
  selected_solution_id BIGINT UNSIGNED NULL,
  status ENUM('open', 'in-progress', 'completed', 'paid', 'closed') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY problems_created_by_idx (created_by),
  KEY problems_status_idx (status),
  KEY problems_reward_type_idx (reward_type),
  KEY problems_selected_solution_idx (selected_solution_id),
  CONSTRAINT problems_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS solutions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  problem_id BIGINT UNSIGNED NOT NULL,
  solver_id BIGINT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  status ENUM('submitted', 'selected', 'rejected', 'paid') NOT NULL DEFAULT 'submitted',
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attachments JSON DEFAULT (JSON_ARRAY()),
  PRIMARY KEY (id),
  UNIQUE KEY solutions_problem_solver_unique (problem_id, solver_id),
  KEY solutions_problem_idx (problem_id),
  KEY solutions_solver_idx (solver_id),
  KEY solutions_status_idx (status),
  CONSTRAINT solutions_problem_fk FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  CONSTRAINT solutions_solver_fk FOREIGN KEY (solver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET @problems_selected_solution_fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'problems'
    AND CONSTRAINT_NAME = 'problems_selected_solution_fk'
);
SET @problems_selected_solution_fk_sql = IF(
  @problems_selected_solution_fk_exists = 0,
  'ALTER TABLE problems ADD CONSTRAINT problems_selected_solution_fk FOREIGN KEY (selected_solution_id) REFERENCES solutions(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE problems_selected_solution_fk_stmt FROM @problems_selected_solution_fk_sql;
EXECUTE problems_selected_solution_fk_stmt;
DEALLOCATE PREPARE problems_selected_solution_fk_stmt;

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  tool_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY cart_items_user_tool_unique (user_id, tool_id),
  KEY cart_items_user_idx (user_id),
  KEY cart_items_tool_idx (tool_id),
  CONSTRAINT cart_items_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT cart_items_tool_fk FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exchange_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_id BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  tools_requested_id BIGINT UNSIGNED NOT NULL,
  tools_offered_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY exchange_requester_idx (requester_id),
  KEY exchange_receiver_idx (receiver_id),
  KEY exchange_requested_tool_idx (tools_requested_id),
  KEY exchange_offered_tool_idx (tools_offered_id),
  KEY exchange_status_idx (status),
  CONSTRAINT exchange_requester_fk FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT exchange_receiver_fk FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT exchange_requested_tool_fk FOREIGN KEY (tools_requested_id) REFERENCES tools(id) ON DELETE CASCADE,
  CONSTRAINT exchange_offered_tool_fk FOREIGN KEY (tools_offered_id) REFERENCES tools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('TOOL_ADDED', 'EXCHANGE_REQUEST', 'EXCHANGE_UPDATE', 'ORDER_RECEIVED', 'ORDER_CREATED', 'OTHER') NOT NULL,
  related_entity_id BIGINT UNSIGNED NULL,
  related_entity_model ENUM('Tool', 'Exchange', 'ExchangeRequest', 'Order') NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY notifications_user_idx (user_id),
  KEY notifications_read_idx (is_read),
  KEY notifications_created_at_idx (created_at),
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mobile_covers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  image_url VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY mobile_covers_filter_idx (company, model, category)
) ENGINE=InnoDB;
