import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

// Configure neon for serverless
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.RENDER_DATABASE_URL });
const db = drizzle({ client: pool });

async function initializeDatabase() {
  console.log('Initializing Render database...');
  
  try {
    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
    `);
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create bases table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bases (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL UNIQUE,
        location VARCHAR NOT NULL,
        commander VARCHAR,
        contact_info VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create equipment_types table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS equipment_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR NOT NULL,
        unit_of_measure VARCHAR DEFAULT 'units',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create assets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        base_id INTEGER REFERENCES bases(id),
        equipment_type_id INTEGER REFERENCES equipment_types(id),
        serial_number VARCHAR,
        status VARCHAR DEFAULT 'available',
        condition VARCHAR DEFAULT 'good',
        location VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create purchases table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        base_id INTEGER REFERENCES bases(id),
        equipment_type_id INTEGER REFERENCES equipment_types(id),
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(10,2),
        total_cost DECIMAL(10,2),
        vendor VARCHAR,
        purchase_date DATE NOT NULL,
        delivery_date DATE,
        status VARCHAR DEFAULT 'ordered',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create transfers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY,
        equipment_type_id INTEGER REFERENCES equipment_types(id),
        from_base_id INTEGER REFERENCES bases(id),
        to_base_id INTEGER REFERENCES bases(id),
        quantity INTEGER NOT NULL,
        transfer_date DATE NOT NULL,
        status VARCHAR DEFAULT 'pending',
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create assignments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        base_id INTEGER REFERENCES bases(id),
        equipment_type_id INTEGER REFERENCES equipment_types(id),
        personnel_name VARCHAR NOT NULL,
        personnel_rank VARCHAR,
        personnel_unit VARCHAR,
        quantity INTEGER NOT NULL,
        assignment_date DATE NOT NULL,
        expected_return_date DATE,
        actual_return_date DATE,
        status VARCHAR DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create expenditures table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenditures (
        id SERIAL PRIMARY KEY,
        base_id INTEGER REFERENCES bases(id),
        equipment_type_id INTEGER REFERENCES equipment_types(id),
        quantity INTEGER NOT NULL,
        expenditure_date DATE NOT NULL,
        reason VARCHAR NOT NULL,
        authorized_by VARCHAR,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create audit_log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR,
        action VARCHAR NOT NULL,
        table_name VARCHAR NOT NULL,
        record_id INTEGER,
        old_values JSONB,
        new_values JSONB,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('Tables created successfully!');
    
    // Insert bases
    await pool.query(`
      INSERT INTO bases (name, location, commander, contact_info) VALUES
      ('Fort Liberty', 'North Carolina, USA', 'BG Sarah Johnson', 'contact@fortliberty.mil'),
      ('Fort Campbell', 'Kentucky, USA', 'MG Michael Davis', 'contact@fortcampbell.mil'),
      ('Fort Hood', 'Texas, USA', 'LTG Robert Smith', 'contact@forthood.mil'),
      ('Joint Base Lewis-McChord', 'Washington, USA', 'BG Jennifer Wilson', 'contact@jblm.mil'),
      ('Camp Pendleton', 'California, USA', 'COL David Brown', 'contact@pendleton.mil')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Insert equipment types
    await pool.query(`
      INSERT INTO equipment_types (name, description, category) VALUES
      ('M4A1 Carbine', 'Standard infantry assault rifle', 'Weapons'),
      ('M249 SAW', 'Squad automatic weapon', 'Weapons'),
      ('M240B Machine Gun', 'Medium machine gun', 'Weapons'),
      ('HMMWV', 'High Mobility Multipurpose Wheeled Vehicle', 'Vehicles'),
      ('M1A2 Abrams', 'Main battle tank', 'Vehicles'),
      ('UH-60 Black Hawk', 'Utility helicopter', 'Aircraft'),
      ('AN/PRC-152', 'Handheld radio', 'Communications'),
      ('AN/PRC-117G', 'Manpack radio', 'Communications'),
      ('5.56mm Ammunition', 'Standard rifle ammunition', 'Ammunition'),
      ('7.62mm Ammunition', 'Machine gun ammunition', 'Ammunition'),
      ('Body Armor', 'Individual protective equipment', 'Personal Equipment'),
      ('ACH Helmet', 'Advanced Combat Helmet', 'Personal Equipment'),
      ('Night Vision Goggles', 'AN/PVS-14 monocular', 'Night Vision'),
      ('Thermal Imaging', 'AN/PAS-13 thermal sight', 'Night Vision'),
      ('Field Medical Kit', 'Combat medic supplies', 'Medical Equipment'),
      ('Portable Generator', '10kW tactical generator', 'Support Equipment')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Insert sample purchases
    await pool.query(`
      INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, total_cost, vendor, purchase_date, status) VALUES
      (1, 1, 50, 1200.00, 60000.00, 'Colt Manufacturing', '2024-01-15', 'delivered'),
      (2, 4, 10, 220000.00, 2200000.00, 'AM General', '2024-02-01', 'delivered'),
      (3, 9, 10000, 0.75, 7500.00, 'Federal Premium', '2024-01-20', 'delivered'),
      (1, 7, 25, 8500.00, 212500.00, 'Harris Corporation', '2024-02-10', 'in_transit'),
      (4, 13, 100, 3500.00, 350000.00, 'L3Harris', '2024-01-25', 'delivered')
      ON CONFLICT DO NOTHING;
    `);
    
    // Insert sample transfers
    await pool.query(`
      INSERT INTO transfers (equipment_type_id, from_base_id, to_base_id, quantity, transfer_date, status, reason) VALUES
      (1, 1, 2, 15, '2024-02-15', 'completed', 'Training exercise support'),
      (9, 3, 1, 2000, '2024-02-20', 'in_transit', 'Ammunition redistribution'),
      (7, 2, 4, 10, '2024-02-25', 'pending', 'Communications upgrade')
      ON CONFLICT DO NOTHING;
    `);
    
    // Insert sample assignments
    await pool.query(`
      INSERT INTO assignments (base_id, equipment_type_id, personnel_name, personnel_rank, personnel_unit, quantity, assignment_date, status) VALUES
      (1, 1, 'John Smith', 'SGT', '1st Infantry Division', 1, '2024-02-01', 'active'),
      (2, 4, 'Mike Johnson', 'SSG', '101st Airborne', 1, '2024-02-05', 'active'),
      (3, 13, 'Sarah Davis', 'CPL', '1st Armored Division', 1, '2024-02-10', 'active')
      ON CONFLICT DO NOTHING;
    `);
    
    // Insert sample expenditures
    await pool.query(`
      INSERT INTO expenditures (base_id, equipment_type_id, quantity, expenditure_date, reason, authorized_by) VALUES
      (1, 9, 500, '2024-02-18', 'Training exercise', 'MAJ Wilson'),
      (2, 10, 200, '2024-02-20', 'Combat operations', 'LTC Brown'),
      (3, 15, 10, '2024-02-22', 'Medical training', 'CPT Anderson')
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run initialization
initializeDatabase().catch(console.error);