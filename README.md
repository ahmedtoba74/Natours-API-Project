# 🌍 Natours API Project

A complete **Tour Booking RESTful API** built with Node.js, Express, and MongoDB following the **MVC architecture**.  
This project is the final result of the [Complete Node.js Bootcamp](https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/) by **Jonas Schmedtmann**.

---

## 🚀 Features

- Full-featured REST API for managing tours, users, bookings, and reviews
- User authentication & authorization with JWT and cookies
- Role-based access control (Admin, User, Guide)
- Advanced filtering, sorting, pagination, and field limiting
- Image upload & processing using Multer and Sharp
- Stripe integration for payment checkout
- Email notifications with HTML templates
- Secure HTTP headers, rate limiting, NoSQL injection protection, and XSS protection
- MVC pattern with modular folder structure
- Pug template rendering for server-side views

---

## 🧱 Project Structure

```
natours/
├── controllers/        # All business logic
├── dev-data/           # Sample data for testing
├── models/             # Mongoose data models
├── public/             # Static files (HTML, CSS, JS)
├── routes/             # Express route handlers
├── utils/              # Helper functions and error handlers
├── views/              # Pug templates for server-rendered pages
├── app.js              # Express app configuration
├── server.js           # Server entry point (DB + app)
├── config.env          # Environment variables
└── README.md
```

---

## 📦 Technologies Used

- **Node.js** & **Express.js**
- **MongoDB** with **Mongoose**
- **JWT** & **Cookies**
- **Stripe** API
- **Pug** (for views)
- **Multer** & **Sharp** (for image upload)
- **dotenv**, **helmet**, **cors**, **xss-clean**, **express-mongo-sanitize**, **hpp**
- **Postman** for API testing

---

## ⚙️ How to Run the Project Locally

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/natours-project.git
    cd natours-project
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set environment variables:**

    Create a file named `config.env` in the root folder and add the following (adjust values):

    ```env
    NODE_ENV=development
    PORT=3000
    DATABASE=mongodb+srv://<USERNAME>:<PASSWORD>@cluster0.mongodb.net/natours
    DATABASE_PASSWORD=yourPassword
    JWT_SECRET=your_jwt_secret
    JWT_EXPIRES_IN=90d
    JWT_COOKIE_EXPIRES_IN=90
    EMAIL_USERNAME=your_email_username
    EMAIL_PASSWORD=your_email_password
    EMAIL_HOST=smtp.mailtrap.io
    EMAIL_PORT=2525
    STRIPE_SECRET_KEY=your_stripe_key
    STRIPE_WEBHOOK_SECRET=your_webhook_key
    ```

4. **Run the development server:**

    ```bash
    npm run start:dev
    ```

5. **Import sample data (optional):**
    ```bash
    node ./dev-data/data/import-dev-data.js
    ```

---

## 📮 API Endpoints

- `/api/v1/tours` – All tour operations (GET, POST, PATCH, DELETE)
- `/api/v1/users` – User registration, login, profile
- `/api/v1/bookings` – Stripe checkout & booking management
- `/api/v1/reviews` – Reviews for tours
- `/` – Server-rendered pages using Pug (overview, login, tour details, etc.)

---

## 🧪 Testing Tools

- [Postman Collection](./natours-postman-collection.json) included
- Test JWT authentication, protected routes, and bookings
- Handle request headers, cookies, and tokens properly

---

## 👨‍💻 Author

**Ahmed Toba Mahmoud**  
[LinkedIn](https://www.linkedin.com/in/ahmed-toba-135287239) | [GitHub](https://github.com/tob4-dev)

---

## 📄 License

For learning and portfolio purposes only. Not for production use.

---

## 🙋‍♂️ Want to Collaborate?

Feel free to fork the repo, open issues, or suggest improvements!
