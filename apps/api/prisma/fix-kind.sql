-- Erstellen einer Sicherungstabelle
CREATE TABLE Dataset_backup (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  source TEXT,
  year INTEGER,
  geo TEXT,
  unit TEXT NOT NULL,
  valueCO2e REAL NOT NULL,
  kind TEXT NOT NULL DEFAULT 'material',
  methodId INTEGER,
  FOREIGN KEY (methodId) REFERENCES Method(id)
);

-- Kopieren aller Daten in die Sicherungstabelle
INSERT INTO Dataset_backup (id, name, source, year, geo, unit, valueCO2e, kind, methodId)
SELECT id, name, source, year, geo, unit, valueCO2e, kind, methodId FROM Dataset;

-- Löschen der alten Tabelle
DROP TABLE Dataset;

-- Umbenennen der Sicherungstabelle
ALTER TABLE Dataset_backup RENAME TO Dataset;

-- Erstellen eines Testdatensatzes für jede Art
INSERT INTO Dataset (name, unit, valueCO2e, source, year, geo, kind) 
VALUES ('Test Material', 'kg', 1.0, 'Test', 2023, 'DE', 'material');

INSERT INTO Dataset (name, unit, valueCO2e, source, year, geo, kind) 
VALUES ('Test Energie', 'kWh', 1.0, 'Test', 2023, 'DE', 'energy');

INSERT INTO Dataset (name, unit, valueCO2e, source, year, geo, kind) 
VALUES ('Test Abfall', 'kg', 1.0, 'Test', 2023, 'DE', 'waste');

INSERT INTO Dataset (name, unit, valueCO2e, source, year, geo, kind) 
VALUES ('Test Emissionen', 'kg', 1.0, 'Test', 2023, 'DE', 'emissions');

-- Anzeigen der Datensätze
SELECT id, name, kind FROM Dataset;
