import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const connectToDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`\n PostgreSQL Connected !! DB HOST: ${process.env.DB_HOST}`);
        
        // Sync models with database (use { alter: true } for development, { force: true } to drop tables)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('Database models synchronized');
        }
    } catch (error) {
        console.log("PostgreSQL connection FAILED: ", error);
        process.exit(1);
    }
}

export { sequelize };
export default connectToDB;