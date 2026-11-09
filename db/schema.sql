-- ScamSense Database Schema
--
-- Satyam: users, scans, administrator seed
-- Ishika: quizzes, questions, options, attempts, articles
-- Gayatri: contact_messages

CREATE DATABASE IF NOT EXISTS scamsense;

USE scamsense;

CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,               -- unique user ID, auto-incremented
  name        VARCHAR(50)  NOT NULL,                        -- user's display name (2-50 chars)
  email       VARCHAR(100) NOT NULL UNIQUE,                 -- user's email (must be unique)
  password    VARCHAR(255) NOT NULL,                        -- bcrypt-hashed password
  role        ENUM('user', 'admin') NOT NULL DEFAULT 'user', -- user role (default: 'user')
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,          -- when the account was created
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- last update time
);

INSERT IGNORE INTO users (id, name, email, password, role) VALUES
(1, 'Admin', 'admin@scamsense.com', '$2b$10$crmpDgnRTcoB7Z8Xwl3eSeltC0RNWl6rpikU6KaOEwJbo/PRhR2mu', 'admin');

CREATE TABLE IF NOT EXISTS articles (
  id          INT AUTO_INCREMENT PRIMARY KEY,               -- unique article ID
  title       VARCHAR(150) NOT NULL,                        -- article title (3-150 characters)
  content     TEXT NOT NULL,                                -- full article content / markdown
  category    VARCHAR(50) NOT NULL,                         -- category: phishing, upi, social_media, general
  author_id   INT NOT NULL,                                 -- references users(id) who created it
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,          -- timestamp when published
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- timestamp of last edit
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quizzes (
  id          INT AUTO_INCREMENT PRIMARY KEY,               -- unique quiz ID
  title       VARCHAR(150) NOT NULL,                        -- quiz title (e.g., 'Phishing Awareness Quiz')
  description TEXT,                                         -- summary description of what the quiz tests
  category    VARCHAR(50) NOT NULL DEFAULT 'general',       -- category e.g. phishing, upi, passwords
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,          -- timestamp when quiz was created
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- timestamp of last edit
);

CREATE TABLE IF NOT EXISTS questions (
  id            INT AUTO_INCREMENT PRIMARY KEY,             -- unique question ID
  quiz_id       INT NOT NULL,                               -- foreign key linking question to a quiz
  question_text TEXT NOT NULL,                              -- the actual question prompt
  explanation   TEXT NOT NULL,                              -- explanation revealed after quiz submission
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,        -- timestamp when question was added
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_options (
  id          INT AUTO_INCREMENT PRIMARY KEY,               -- unique option ID
  question_id INT NOT NULL,                                 -- foreign key linking option to a question
  option_text VARCHAR(255) NOT NULL,                        -- choice text presented to the user
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,               -- true (1) if correct, false (0) if incorrect
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id              INT AUTO_INCREMENT PRIMARY KEY,           -- unique attempt record ID
  user_id         INT NOT NULL,                             -- foreign key linking attempt to user
  quiz_id         INT NOT NULL,                             -- foreign key linking attempt to quiz
  score           INT NOT NULL,                             -- number of correct answers scored
  total_questions INT NOT NULL,                             -- total questions attempted
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- timestamp when quiz was taken
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

INSERT IGNORE INTO articles (id, title, content, category, author_id) VALUES
(
  1,
  'How to Spot Phishing Emails and Malicious Links',
  'Phishing is one of the most common cyber threats in India today. Attackers disguise themselves as trusted institutions like banks, courier services, or government bodies.\n\nKey Red Flags to Watch For:\n1. Suspicious Sender Domains: Look closely at the email sender address. For example, support@paypaI.com may use an uppercase I instead of a lowercase l.\n2. Urgent or Threatening Language: Messages saying "Account suspended within 24 hours" are designed to create panic so you act before thinking.\n3. Mismatched Links: Hover over links without clicking. The actual URL may point to a completely different, unverified web server.\n4. Requests for Sensitive Info: Genuine banks will NEVER ask for your password, PIN, or OTP over email.\n\nAlways verify directly with official customer care numbers from verified websites.',
  'phishing',
  1
),
(
  2,
  'Understanding UPI Scams: QR Codes and Money Requests',
  'Unified Payments Interface (UPI) has revolutionized digital payments in India, but fraudsters exploit common misconceptions about how it functions.\n\nGolden Rule of UPI:\nEntering your UPI PIN always DEBITS money from your account. You NEVER need to enter a UPI PIN to RECEIVE money.\n\nCommon UPI Scams:\n1. OLX / Marketplace QR Code Scam: A fake buyer claims they will pay you by sending a QR code. They ask you to scan it and enter your PIN. Doing so immediately deducts money from your account.\n2. Collect Request Fraud: Scammers send a "Collect Money" request with a description like "Refund Approved" or "Lottery Prize". Clicking approve and typing your PIN transfers funds to the fraudster.\n3. Screen Sharing Apps: Never install remote access applications like AnyDesk, TeamViewer, or RustDesk on the advice of an unknown caller.',
  'upi',
  1
),
(
  3,
  'Social Engineering: How Scammers Manipulate Trust',
  'Social engineering relies on human psychology rather than technical hacking tricks. Cybercriminals exploit fear, greed, urgency, and helpfulness to extract sensitive data.\n\nCommon Tactics:\n1. Digital Arrest Scams: Fraudsters impersonate police or CBI officials over video calls, claiming your Aadhaar is linked to illegal parcels, and threaten arrest unless verification funds are transferred.\n2. Fake Job Offers: Telegram and WhatsApp messages promising Rs 3,000 daily for liking YouTube videos or rating hotels.\n3. Investment & Crypto Frauds: Telegram groups showing falsified profit screenshots tempting victims into depositing money into unauthorized apps.\n\nDefense Strategy:\nTake a pause, verify independently, and report cyber incidents at cybercrime.gov.in or toll-free helpline 1930.',
  'social_media',
  1
);

-- Seed Sample Quizzes
INSERT IGNORE INTO quizzes (id, title, description, category) VALUES
(
  1,
  'Phishing & Fake Link Awareness',
  'Test your ability to identify suspicious emails, fake login links, and deceptive sender addresses.',
  'phishing'
),
(
  2,
  'UPI & Online Banking Security',
  'Learn the golden rules of UPI safety, QR code mechanics, and protecting your financial accounts.',
  'upi'
);

-- Seed Questions for Quiz 1: Phishing & Fake Link Awareness
INSERT IGNORE INTO questions (id, quiz_id, question_text, explanation) VALUES
(
  1,
  1,
  'You receive an email claiming: "Your HDFC netbanking account is suspended. Click here to update KYC immediately." What is the safest course of action?',
  'Never click links in urgent KYC warning emails. Official banks never suspend accounts via arbitrary email links. Always log in directly via the official bank app or portal.'
),
(
  2,
  1,
  'Which of the following sender addresses is MOST likely an impostor phishing email for Netflix?',
  'Phishing domains often use hyphens or subdomains like "netflix-billing-support.com" to mislead recipients. Official Netflix emails strictly originate from @netflix.com.'
),
(
  3,
  1,
  'A lottery SMS states: "Congratulations! You won Rs 25,00,000 in KBC Lucky Draw. Call Mr. Sharma on 9876543210 to claim." Why is this a scam?',
  'Lottery scams exploit greed and urgency. Legitimate contests do not award millions to random phone numbers, nor do they ask winners to call mobile numbers to claim prizes.'
);

-- Seed Options for Quiz 1 Questions
-- Question 1 Options
INSERT IGNORE INTO question_options (id, question_id, option_text, is_correct) VALUES
(1, 1, 'Click the link immediately to prevent account suspension', FALSE),
(2, 1, 'Ignore the email link and check directly via your official netbanking portal or app', TRUE),
(3, 1, 'Reply to the email with your account number and customer ID', FALSE),
(4, 1, 'Forward the email to all your colleagues to see if they got it', FALSE);

-- Question 2 Options
INSERT IGNORE INTO question_options (id, question_id, option_text, is_correct) VALUES
(5, 2, 'info@mailer.netflix.com', FALSE),
(6, 2, 'support@netflix-billing-support.com', TRUE),
(7, 2, 'no-reply@netflix.com', FALSE),
(8, 2, 'updates@netflix.com', FALSE);

-- Question 3 Options
INSERT IGNORE INTO question_options (id, question_id, option_text, is_correct) VALUES
(9, 3, 'Because KBC only awards prizes in US Dollars', FALSE),
(10, 3, 'Because legitimate organizations never award unsolicited lotteries or ask for fee deposits to release prizes', TRUE),
(11, 3, 'Because the prize amount is too small', FALSE),
(12, 3, 'Because SMS messages cannot be scams', FALSE);

-- Seed Questions for Quiz 2: UPI & Online Banking Security
INSERT IGNORE INTO questions (id, quiz_id, question_text, explanation) VALUES
(
  4,
  2,
  'When is entering your UPI PIN required during a transaction?',
  'The UPI PIN is your authorization key to transfer money OUT of your bank account. You NEVER need to enter a PIN to receive money.'
),
(
  5,
  2,
  'An unknown buyer on OLX sends you a QR code claiming: "Scan this to receive Rs 4,500 advance payment for your sofa." What happens if you scan and enter your PIN?',
  'Scanning a QR code and entering your PIN initiates a DEBIT from your bank account to the scammer. QR codes are meant for paying, never for receiving money.'
);

-- Seed Options for Quiz 2 Questions
-- Question 4 Options
INSERT IGNORE INTO question_options (id, question_id, option_text, is_correct) VALUES
(13, 4, 'Only when you want to send money or check your bank balance', TRUE),
(14, 4, 'Whenever someone sends money to your Google Pay or PhonePe account', FALSE),
(15, 4, 'When claiming an online cashback reward', FALSE),
(16, 4, 'Both while sending and receiving money', FALSE);

-- Question 5 Options
INSERT IGNORE INTO question_options (id, question_id, option_text, is_correct) VALUES
(17, 5, 'Rs 4,500 will be credited directly to your bank balance', FALSE),
(18, 5, 'Rs 4,500 will be deducted from your bank account and sent to the scammer', TRUE),
(19, 5, 'Your phone will download a verification certificate', FALSE),
(20, 5, 'A one-time OTP will be generated by the bank', FALSE);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,               -- unique message ID
  name       VARCHAR(50)  NOT NULL,                        -- sender's name (2-50 chars)
  email      VARCHAR(100) NOT NULL,                        -- sender's contact email
  subject    VARCHAR(150) NOT NULL,                        -- subject of inquiry (3-150 chars)
  message    TEXT NOT NULL,                                -- detailed message body
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP           -- submission timestamp
);

-- Seed Sample Contact Messages for Demonstration
INSERT IGNORE INTO contact_messages (id, name, email, subject, message) VALUES
(
  1,
  'Rahul Sharma',
  'rahul.sharma@example.com',
  'Suspected Electricity Bill Scam SMS',
  'I received an SMS claiming my electricity will be disconnected tonight at 9:30 PM unless I call a private phone number. Is this a known scam pattern?'
),
(
  2,
  'Priya Patel',
  'priya.patel@example.com',
  'Feedback on UPI Quiz',
  'The UPI quiz was very informative! It helped my parents understand why they should never enter their PIN to receive money from OLX buyers.'
);

CREATE TABLE IF NOT EXISTS scans (
  id               INT AUTO_INCREMENT PRIMARY KEY,          -- unique scan ID
  user_id          INT NOT NULL,                            -- foreign key to users(id)
  message_text     TEXT NOT NULL,                           -- the analyzed suspicious message text
  verdict          ENUM('SAFE', 'SUSPICIOUS', 'HIGH_RISK', 'UNVERIFIED') NOT NULL, -- final categorical verdict
  matched_patterns TEXT NOT NULL,                           -- JSON serialized analysis report
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- scan timestamp
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
