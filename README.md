# Inventory Management Module


> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Database Setup

1. XAMPP
	Download and install XAMPP. This will install MySQL and phpMyAdmin for easy database management.

2. Start MySQL Server
	Open the XAMPP Control Panel.
	Start the MySQL service.
	(Optional) Start Apache to access phpMyAdmin at http://localhost/phpmyadmin.

3. Create Database and Table
	Navigate to http://localhost/phpmyadmin.
	Create a new database (e.g., astro_db).
	Create necessary tables and insert data manually or via SQL import.

4. Database Configuration
	Create a ".env" file in your Astro project root and add your database connection:

	.env content:
		DB_HOST=localhost
		DB_USER=root
		DB_PASSWORD=
		DB_NAME=inventory_management

	(when error is about env do -> "npm install" on terminal or bash)


note: 'users.ts' is sample on how to use database
##	> di pa sure kung ganon gagawin  