import type { Template } from '../template';

export default {
	order: 1,
	topic: 'health',
	name: { es: 'Clínica y citas', en: 'Clinic and appointments' },
	description: {
		es: 'Pacientes, médicos, especialidades, citas, recetas y medicamentos.',
		en: 'Patients, doctors, specialities, appointments, prescriptions and medications.'
	},
	tags: ['bookings', 'states'],
	sql: `CREATE TABLE specialties (
	id SMALLINT PRIMARY KEY,
	name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE doctors (
	id BIGSERIAL PRIMARY KEY,
	specialty_id SMALLINT NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,
	name VARCHAR(120) NOT NULL,
	license_number VARCHAR(40) NOT NULL UNIQUE
);
CREATE INDEX ix_doctors_specialty_id ON doctors (specialty_id);

CREATE TABLE patients (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	birth_date DATE NOT NULL,
	phone VARCHAR(40),
	email VARCHAR(255)
);

CREATE TABLE appointments (
	id BIGSERIAL PRIMARY KEY,
	patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
	doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
	starts_at TIMESTAMPTZ NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
	notes TEXT
);
CREATE INDEX ix_appointments_patient_id ON appointments (patient_id);
CREATE INDEX ix_appointments_doctor_id ON appointments (doctor_id);

CREATE TABLE medications (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL UNIQUE,
	unit VARCHAR(20) NOT NULL
);

CREATE TABLE prescriptions (
	id BIGSERIAL PRIMARY KEY,
	appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
	medication_id BIGINT NOT NULL REFERENCES medications(id) ON DELETE RESTRICT,
	dosage VARCHAR(80) NOT NULL,
	days INT NOT NULL
);
CREATE INDEX ix_prescriptions_appointment_id ON prescriptions (appointment_id);
CREATE INDEX ix_prescriptions_medication_id ON prescriptions (medication_id);
`
} satisfies Template;
