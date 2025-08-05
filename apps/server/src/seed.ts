import "dotenv/config";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../prisma";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create categories
  const beverages = await prisma.category.create({
    data: {
      name: "Beverages",
      description: "Hot and cold drinks",
    },
  });

  const food = await prisma.category.create({
    data: {
      name: "Food",
      description: "Meals and snacks",
    },
  });

  const desserts = await prisma.category.create({
    data: {
      name: "Desserts",
      description: "Sweet treats",
    },
  });

  // Create menu items
  const menuItems = [
    // Beverages
    {
      name: "Espresso",
      price: 2.5,
      categoryId: beverages.id,
      description: "Strong Italian coffee",
    },
    {
      name: "Cappuccino",
      price: 3.5,
      categoryId: beverages.id,
      description: "Espresso with steamed milk foam",
    },
    {
      name: "Latte",
      price: 4.0,
      categoryId: beverages.id,
      description: "Espresso with steamed milk",
    },
    {
      name: "Americano",
      price: 3.0,
      categoryId: beverages.id,
      description: "Espresso with hot water",
    },
    {
      name: "Iced Coffee",
      price: 3.5,
      categoryId: beverages.id,
      description: "Cold brew coffee over ice",
    },
    {
      name: "Hot Tea",
      price: 2.0,
      categoryId: beverages.id,
      description: "Selection of premium teas",
    },

    // Food
    {
      name: "Croissant",
      price: 3.5,
      categoryId: food.id,
      description: "Buttery French pastry",
    },
    {
      name: "Bagel with Cream Cheese",
      price: 4.5,
      categoryId: food.id,
      description: "Fresh bagel with cream cheese",
    },
    {
      name: "Avocado Toast",
      price: 8.5,
      categoryId: food.id,
      description: "Sourdough with fresh avocado",
    },
    {
      name: "Grilled Sandwich",
      price: 7.5,
      categoryId: food.id,
      description: "Ham and cheese grilled sandwich",
    },
    {
      name: "Caesar Salad",
      price: 9.5,
      categoryId: food.id,
      description: "Fresh romaine with caesar dressing",
    },
    {
      name: "Soup of the Day",
      price: 6.5,
      categoryId: food.id,
      description: "Chef's daily soup selection",
    },

    // Desserts
    {
      name: "Chocolate Cake",
      price: 5.5,
      categoryId: desserts.id,
      description: "Rich chocolate layer cake",
    },
    {
      name: "Cheesecake",
      price: 6.0,
      categoryId: desserts.id,
      description: "New York style cheesecake",
    },
    {
      name: "Muffin",
      price: 3.5,
      categoryId: desserts.id,
      description: "Blueberry or chocolate chip",
    },
    {
      name: "Cookie",
      price: 2.5,
      categoryId: desserts.id,
      description: "Chocolate chip or oatmeal raisin",
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        price: new Decimal(item.price),
      },
    });
  }

  // Create sample customers
  const customers = [
    { name: "John Doe", phone: "+1234567890", email: "john@example.com" },
    { name: "Jane Smith", phone: "+1234567891", email: "jane@example.com" },
    { name: "Bob Johnson", phone: "+1234567892", email: "bob@example.com" },
    { name: "Alice Brown", phone: "+1234567893", email: "alice@example.com" },
    {
      name: "Charlie Wilson",
      phone: "+1234567894",
      email: "charlie@example.com",
    },
  ];

  for (const customer of customers) {
    await prisma.customer.create({
      data: customer,
    });
  }

  // Create sample users with different roles
  const sampleUsers = [
    {
      id: "user_reception_demo",
      name: "Reception User",
      email: "reception@cafe.com",
      role: "RECEPTION",
      password: "password123",
    },
    {
      id: "user_cashier_demo",
      name: "Cashier User",
      email: "cashier@cafe.com",
      role: "CASHIER",
      password: "password123",
    },
    {
      id: "user_chef_demo",
      name: "Chef User",
      email: "chef@cafe.com",
      role: "CHEF",
      password: "password123",
    },
    {
      id: "user_superadmin_demo",
      name: "Super Admin",
      email: "admin@cafe.com",
      role: "SUPER_ADMIN",
      password: "admin123",
    },
  ];

  for (const userData of sampleUsers) {
    // Create user
    await prisma.user.create({
      data: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: false,
        role: userData.role as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create account for email/password auth
    await prisma.account.create({
      data: {
        id: `account_${userData.id}`,
        accountId: userData.id,
        providerId: "credential",
        userId: userData.id,
        password: userData.password, // In production, this should be hashed
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log("📧 Demo accounts created:");
  console.log("   Reception: reception@cafe.com / password123");
  console.log("   Cashier: cashier@cafe.com / password123");
  console.log("   Chef: chef@cafe.com / password123");
  console.log("   Super Admin: admin@cafe.com / admin123");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
