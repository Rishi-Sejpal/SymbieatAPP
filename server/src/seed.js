import mongoose from 'mongoose';
import { connectDB } from './db.js';
import User from './models/User.js';
import MenuItem from './models/MenuItem.js';
import StockItem from './models/StockItem.js';
import Order from './models/Order.js';
import Feedback from './models/Feedback.js';
import Attendance from './models/Attendance.js';

const MENU = [
  ['Classic Veg Thali', 'Roti, rice, dal, sabzi, salad & papad — the everyday favorite.', 90, 'Main Course', 'main', true, 12, ['thali', 'veg']],
  ['Paneer Butter Masala + Naan', 'Rich tomato-cashew gravy with butter naan.', 130, 'Main Course', 'main', true, 15, ['paneer', 'punjabi']],
  ['Chicken Biryani', 'Fragrant basmati dum-cooked with spices & raita.', 150, 'Main Course', 'main', false, 20, ['biryani', 'chicken']],
  ['Masala Dosa', 'Crispy dosa, spiced potato filling, sambar & chutney.', 70, 'Breakfast', 'south', true, 10, ['dosa', 'south indian']],
  ['Idli Sambar (4 pc)', 'Steamed idlis with hot sambar & coconut chutney.', 45, 'Breakfast', 'south', true, 8, ['idli', 'steamed']],
  ['Poha + Chai Combo', 'Light flattened-rice breakfast with cutting chai.', 40, 'Combos', 'main', true, 6, ['combo', 'chai']],
  ['Veg Sandwich', 'Triple-layer grilled sandwich with mint chutney.', 55, 'Snacks', 'north', true, 7, ['sandwich', 'grilled']],
  ['Samosa (2 pc)', 'Golden-fried pastry with spiced potato & peas.', 30, 'Snacks', 'north', true, 5, ['samosa', 'fried']],
  ['Vada Pav', 'Mumbai classic with dry garlic chutney.', 25, 'Snacks', 'north', true, 5, ['vada pav', 'mumbai']],
  ['Chole Bhature', 'Fluffy bhature with dark chole & onions.', 95, 'Main Course', 'north', true, 15, ['punjabi']],
  ['Masala Chai', 'Kettle-brewed with ginger & cardamom.', 15, 'Beverages', 'beverages', true, 3, ['chai']],
  ['Filter Coffee', 'Traditional South Indian filter coffee.', 20, 'Beverages', 'beverages', true, 4, ['coffee']],
  ['Cold Coffee', 'Chilled, frothy and generously iced.', 55, 'Beverages', 'beverages', true, 5, ['cold coffee']],
  ['Fresh Lime Soda', 'Sweet-salt, topped with mint.', 35, 'Beverages', 'beverages', true, 3, ['lime', 'refreshing']],
  ['Gulab Jamun (2 pc)', 'Warm, syrup-soaked classic.', 40, 'Desserts', 'beverages', true, 4, ['dessert', 'sweet']],
  ['Chocolate Brownie', 'Fudgy walnut brownie, served warm.', 60, 'Desserts', 'beverages', true, 4, ['brownie', 'chocolate']],
  ['Veg Hakka Noodles', 'Wok-tossed noodles with garden veggies.', 85, 'Main Course', 'south', true, 12, ['noodles', 'indo-chinese']],
  ['Egg Bhurji + Pav', 'Campus-style spicy scramble with buttered pav.', 75, 'Breakfast', 'main', false, 10, ['egg']],
];

const STOCK = [
  ['Rice (Basmati)', 'Grains', 45, 20, 'kg', 85],
  ['Atta (Wheat Flour)', 'Grains', 60, 25, 'kg', 45],
  ['Toor Dal', 'Pulses', 18, 15, 'kg', 120],
  ['Paneer', 'Dairy', 6, 8, 'kg', 320],
  ['Cooking Oil', 'Oils', 35, 20, 'l', 140],
  ['Chicken', 'Meat', 12, 10, 'kg', 260],
  ['Milk', 'Dairy', 40, 25, 'l', 60],
  ['Tea Leaves', 'Beverages', 9, 5, 'kg', 450],
  ['Coffee Powder', 'Beverages', 4, 5, 'kg', 700],
  ['Onions', 'Vegetables', 30, 20, 'kg', 35],
  ['Tomatoes', 'Vegetables', 16, 18, 'kg', 40],
  ['Potatoes', 'Vegetables', 50, 20, 'kg', 30],
  ['Paper Plates', 'Disposables', 450, 200, 'pcs', 2.5],
  ['Serviettes', 'Disposables', 900, 300, 'pcs', 0.5],
];

export async function seed() {
  const existing = await User.countDocuments();
  if (existing > 0) {
    console.log('[seed] Database already seeded, skipping.');
    return;
  }

  console.log('[seed] Creating demo data…');
  const users = await User.create([
    { name: 'Aarav Mehta', email: 'student@symbieat.dev', password: 'student123', role: 'student', studentId: 'S2023_0451', department: 'SCIT B.Tech IT' },
    { name: 'Diya Sharma', email: 'staff@symbieat.dev', password: 'staff123', role: 'staff', department: 'Canteen Office' },
    { name: 'Chef Vikram', email: 'chef@symbieat.dev', password: 'chef123', role: 'chef', department: 'Main Counter' },
    { name: 'Chef Anjali', email: 'chef2@symbieat.dev', password: 'chef123', role: 'chef', department: 'South Counter' },
    { name: 'Admin Priya', email: 'admin@symbieat.dev', password: 'admin123', role: 'admin', department: 'Administration' },
  ]);
  const [student, , chef1] = users;

  const menu = await MenuItem.insertMany(
    MENU.map(([name, description, price, category, counter, isVeg, prepMinutes, tags], i) => ({
      name,
      description,
      price,
      category,
      counter,
      isVeg,
      prepMinutes,
      tags,
      rating: Math.round((3.8 + (i % 10) / 10) * 10) / 10,
      ratingCount: 12 + ((i * 7) % 40),
      dailyStockLimit: 0,
    }))
  );

  await StockItem.insertMany(
    STOCK.map(([name, category, quantity, threshold, unit, costPerUnit]) => ({
      name, category, quantity, threshold, unit, costPerUnit,
      supplier: 'SymbiBulk Suppliers Pvt Ltd',
      lastRestockedAt: new Date(Date.now() - 86400000 * 2),
    }))
  );

  // A few realistic orders across statuses and the last 5 days
  const statuses = ['completed', 'completed', 'completed', 'ready', 'preparing', 'confirmed', 'cancelled'];
  for (let i = 0; i < 14; i++) {
    const daysAgo = i % 6;
    const created = new Date(Date.now() - daysAgo * 86400000 - (i % 8) * 3600000);
    const mi = menu[(i * 5) % menu.length];
    const qty = 1 + (i % 3);
    const status = i < 4 ? 'placed' : statuses[i % statuses.length];
    const order = await Order.create({
      customer: student,
      items: [{ menuItem: mi._id, name: mi.name, price: mi.price, quantity: qty, isVeg: mi.isVeg }],
      totalAmount: mi.price * qty,
      counter: mi.counter,
      status: 'placed',
      paymentStatus: ['completed', 'ready'].includes(status) ? 'paid' : 'pending',
      paymentMethod: ['completed', 'ready'].includes(status) ? (i % 2 ? 'upi' : 'card') : null,
      estimatedMinutes: mi.prepMinutes,
      statusHistory: [{ status: 'placed', at: created }],
      createdAt: created,
    });
    if (status !== 'placed') {
      const flow = ['confirmed', 'preparing', 'ready', 'completed'];
      const upto = flow.indexOf(status === 'cancelled' ? 'confirmed' : status);
      const hist = [{ status: 'placed', at: created }];
      for (let s = 0; s <= upto; s++) hist.push({ status: flow[s], at: new Date(created.getTime() + (s + 1) * 600000) });
      if (status === 'cancelled') hist.push({ status: 'cancelled', at: new Date(created.getTime() + 3600000) });
      order.statusHistory = hist;
      order.status = status;
      order.assignedChef = i % 2 ? chef1._id : undefined;
      order.completedAt = status === 'completed' ? new Date(created.getTime() + 3000000) : null;
      order.cancelledReason = status === 'cancelled' ? 'Item unavailable' : '';
      await order.save();
    }
  }

  await Feedback.create([
    { user: student, menuItem: menu[1]._id, rating: 5, comment: 'Best paneer on campus, no notes.' },
    { user: student, menuItem: menu[2]._id, rating: 4, comment: 'Great biryani, slightly spicy for me.' },
    { user: student, rating: 3, comment: 'Queue at peak lunch hour is long — more counters please!' },
  ]);

  const d = new Date();
  const iso = (offset) => new Date(d.getTime() - offset * 86400000).toISOString().slice(0, 10);
  await Attendance.create([
    { staff: chef1._id, date: iso(0), status: 'present', checkIn: '07:30' },
    { staff: chef1._id, date: iso(1), status: 'present', checkIn: '07:32' },
    { staff: chef1._id, date: iso(2), status: 'leave', note: 'Family function' },
  ]);

  console.log('[seed] Done. Demo logins:');
  console.log('  admin@symbieat.dev / admin123  (Admin)');
  console.log('  chef@symbieat.dev  / chef123   (Chef)');
  console.log('  staff@symbieat.dev / staff123  (Staff)');
  console.log('  student@symbieat.dev / student123 (Student)');
}

// Run directly: node src/seed.js
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await connectDB();
    await seed();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[seed] failed:', err);
    process.exit(1);
  }
}
