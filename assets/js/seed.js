// ═══════════════════════════════════════
//  assets/js/seed.js
//  Run this ONCE to populate Firebase
//  with sample data
// ═══════════════════════════════════════

import { db } from './firebase-config.js';
import { collection, doc, setDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function seedDatabase() {
  console.log('🌱 Seeding Firebase database...');

  // ── Blood Inventory ──────────────────
  const inventory = [
    { blood_group:'A+',  units:142, expiry:'2026-04-20' },
    { blood_group:'A-',  units:38,  expiry:'2026-04-15' },
    { blood_group:'B+',  units:186, expiry:'2026-04-22' },
    { blood_group:'B-',  units:24,  expiry:'2026-04-18' },
    { blood_group:'AB+', units:67,  expiry:'2026-04-25' },
    { blood_group:'AB-', units:19,  expiry:'2026-04-10' },
    { blood_group:'O+',  units:359, expiry:'2026-04-28' },
    { blood_group:'O-',  units:12,  expiry:'2026-04-05' },
  ];
  for (const item of inventory) {
    await setDoc(doc(db, 'inventory', item.blood_group), item);
  }

  // ── Donors ───────────────────────────
  const donors = [
    { name:'Ravi Kumar',  age:28, gender:'Male',   blood_group:'B+',  phone:'+91 98765 11111', email:'ravi@email.com',   address:'Chennai',    status:'Eligible', last_donated:'2026-03-20', created_at: new Date() },
    { name:'Priya Nair',  age:34, gender:'Female', blood_group:'O+',  phone:'+91 87654 22222', email:'priya@email.com',  address:'Coimbatore', status:'Eligible', last_donated:'2026-03-20', created_at: new Date() },
    { name:'Arun Sharma', age:22, gender:'Male',   blood_group:'A+',  phone:'+91 76543 33333', email:'arun@email.com',   address:'Madurai',    status:'Eligible', last_donated:'2026-03-18', created_at: new Date() },
    { name:'Deepa Raj',   age:29, gender:'Female', blood_group:'AB+', phone:'+91 65432 44444', email:'deepa@email.com',  address:'Trichy',     status:'Waiting',  last_donated:'2026-02-10', created_at: new Date() },
    { name:'Suresh M.',   age:41, gender:'Male',   blood_group:'B-',  phone:'+91 54321 55555', email:'suresh@email.com', address:'Salem',      status:'Eligible', last_donated:'2026-03-20', created_at: new Date() },
    { name:'Kavitha S.',  age:26, gender:'Female', blood_group:'O-',  phone:'+91 43210 66666', email:'kavitha@email.com',address:'Erode',      status:'Eligible', last_donated:'2026-01-05', created_at: new Date() },
  ];
  for (const d of donors) await addDoc(collection(db, 'donors'), d);

  // ── Hospitals ────────────────────────
  const hospitals = [
    { name:'City General Hospital',       district:'Chennai Central', phone:'044-2200-1111', email:'city@hospital.com',   contact_person:'Dr. Ramesh',  status:'Active', created_at: new Date() },
    { name:'Apollo Hospitals',            district:'Greams Road',     phone:'044-2829-0000', email:'apollo@hospital.com', contact_person:'Dr. Priya',   status:'Active', created_at: new Date() },
    { name:'MIOT International',          district:'Manapakkam',      phone:'044-4200-2288', email:'miot@hospital.com',   contact_person:'Dr. Kumar',   status:'Active', created_at: new Date() },
    { name:'Fortis Malar Hospital',       district:'Adyar',           phone:'044-4289-2888', email:'fortis@hospital.com', contact_person:'Dr. Meena',   status:'Active', created_at: new Date() },
    { name:'Rajiv Gandhi Govt. Hospital', district:'Park Town',       phone:'044-2530-5000', email:'rggmc@hospital.com',  contact_person:'Dr. Senthil', status:'Active', created_at: new Date() },
  ];
  for (const h of hospitals) await addDoc(collection(db, 'hospitals'), h);

  // ── Staff ─────────────────────────────
  const staff = [
    { name:'Dr. Karthik S.', role:'Medical Officer',    email:'karthik@lifeflow.org', phone:'+91 98765 43210', status:'Active'   },
    { name:'Anitha R.',      role:'Lab Technician',     email:'anitha@lifeflow.org',  phone:'+91 87654 32109', status:'Active'   },
    { name:'Mohan D.',       role:'Blood Bank Officer', email:'mohan@lifeflow.org',   phone:'+91 76543 21098', status:'On Leave' },
    { name:'Sunita K.',      role:'Admin Assistant',    email:'sunita@lifeflow.org',  phone:'+91 65432 10987', status:'Active'   },
  ];
  for (const s of staff) await addDoc(collection(db, 'staff'), s);

  console.log('✅ Database seeded successfully!');
  alert('✅ Firebase database seeded with sample data!');
}
