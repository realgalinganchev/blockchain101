import path from "path";
import swaggerJsdoc from "swagger-jsdoc";

 const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Blockchain101 API",
      version: "1.0.0",
      description: "API documentation for Blockchain101",
    },
    servers: [
      {
        url: process.env.BACKEND_API_URL,
      },
    ],
  },
  apis: [path.join(__dirname, "swagger.js")],
};


export const swaggerDocs = swaggerJsdoc(swaggerOptions);
