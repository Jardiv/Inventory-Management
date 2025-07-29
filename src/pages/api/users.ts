// 
// THIS IS JUST AN EXAMPLE OF HOW TO USE/QUERY THE DATABASE
// 
// 
// src/pages/api/users.ts
import type { APIRoute } from 'astro';
import db from '../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('MySQL error:', err);
    return new Response(JSON.stringify({ error: 'Database error' }), {
      status: 500
    });
  }
};


/* 

SAMPLE USE FOR .ASTRO FILE

---
// server-side fetch
const res = await fetch('http://localhost:4321/api/users');
const users = await res.json();
const resInvoices = await fetch('http://localhost:4321/api/invoices');
const invoices = await resInvoices.json();
---

<div class="">
	<h1>User List</h1>
    <ul>
      {users.map(user => (
        <li><strong>{user.name}</strong> – {user.email}</li>
      ))}
    </ul>

</div>
*/