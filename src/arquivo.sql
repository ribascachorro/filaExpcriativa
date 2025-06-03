CREATE DATABASE IF NOT EXISTS `exp-criativa-fila`;

USE `exp-criativa-fila`;

CREATE TABLE `patients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL,
  `birth_date` DATE NOT NULL,
  `insurance_provider` VARCHAR(100) NULL,
  `insurance_number` VARCHAR(50) NULL,
  `cpf` VARCHAR(11) NOT NULL UNIQUE,
  `user_id` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Chave estrangeira opcional para vincular a um usuário
  INDEX (`user_id`),
  CONSTRAINT `fk_patients_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE `queue_entries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `is_priority` TINYINT NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'waiting',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `served_at` DATETIME NULL,
  `cancelled_at` DATETIME NULL,
  `notified_at` DATETIME NULL,
  INDEX `idx_queue_priority_time` (`is_priority`, `created_at`),
  CONSTRAINT `fk_queue_patient`
    FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `login` VARCHAR(100) NOT NULL UNIQUE,
  `senha` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','user', 'doctor') NOT NULL DEFAULT 'user',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Criar tabela de anamnese para cada paciente
CREATE TABLE `anamnese` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `data_consulta` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `queixa_principal` TEXT NOT NULL,
  `historia_da_doenca_atual` TEXT NULL,
  `historico_medico` TEXT NULL,
  `medicacoes_em_uso` TEXT NULL,
  `alergias` TEXT NULL,
  `historico_familiar` TEXT NULL,
  `habitos_de_vida` TEXT NULL,
  `sintomas_rev_sistemas` TEXT NULL,
  `outras_informacoes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL 
    DEFAULT CURRENT_TIMESTAMP 
    ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`patient_id`),
  CONSTRAINT `fk_anamnese_patient`
    FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

USE `exp-criativa-fila`;

-- 1) Anamnese para o paciente de ID = 1
INSERT INTO `anamnese` (
  `patient_id`,
  `data_consulta`,
  `queixa_principal`,
  `historia_da_doenca_atual`,
  `historico_medico`,
  `medicacoes_em_uso`,
  `alergias`,
  `historico_familiar`,
  `habitos_de_vida`,
  `sintomas_rev_sistemas`,
  `outras_informacoes`
) VALUES (
  1,
  '2025-05-30 10:00:00',
  'Dor de cabeça frequente há 2 semanas',
  'Paciente relata cefaleia diária de intensidade moderada, piora no período vespertino e alívio parcial com analgésicos comuns.',
  'Sem histórico de enxaqueca ou outras doenças crônicas. Nega hipertensão e diabetes.',
  'Não faz uso de medicações de uso contínuo.',
  'Nega alergias conhecidas.',
  'Pai hipertenso, mãe diabética tipo 2.',
  'Sedentário; relata ingestão de 2 cafés por dia e ingestão de álcool social nos finais de semana.',
  'Nega alterações gastrointestinais, quadro respiratório estável, sem queixas cardiovasculares.',
  'Paciente mora em local com barulho intenso próximo, possível fator de gatilho para cefaleia.'
);