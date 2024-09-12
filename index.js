#!/usr/bin/env node

const axios = require('axios');
const { program } = require('commander');
const fs = require('fs');

// Configura o Commander para receber o nome do módulo como parâmetro
program
  .version('1.4.0') // Versão atualizada
  .description('CLI para mapear o Swagger e retornar o JSON por rota ou módulo.')
  .option('-u, --url <url>', 'URL do Swagger JSON', 'http://localhost:3000/swagger-json')
  .option('-m, --modules <modules>', 'Nome(s) do(s) módulo(s) ou rota(s) separados por vírgula')
  .option('-o, --output <file>', 'Salvar o resultado em um arquivo JSON')
  .parse(process.argv);

const options = program.opts();

if (!options.modules) {
  console.error('Por favor, forneça o nome de um ou mais módulos com a opção --modules.');
  process.exit(1);
}

// Função para buscar o Swagger JSON
const fetchSwaggerJSON = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar o Swagger JSON:', error.message);
    process.exit(1);
  }
};

// Função para validar se os módulos fornecidos existem no Swagger
const validateModules = (swaggerData, moduleNames) => {
  const allTags = new Set();
  
  // Percorre todas as rotas para coletar as tags existentes
  Object.values(swaggerData.paths).forEach((methods) => {
    Object.values(methods).forEach((method) => {
      if (method.tags) {
        method.tags.forEach((tag) => allTags.add(tag));
      }
    });
  });

  const invalidModules = moduleNames.filter((module) => !allTags.has(module));
  if (invalidModules.length > 0) {
    console.error(`Os seguintes módulos não existem no Swagger: ${invalidModules.join(', ')}`);
    process.exit(1);
  }
};

// Função para filtrar as rotas por módulo
const filterByModules = (swaggerData, moduleNames) => {
  const { paths, components, openapi, info, security } = swaggerData;

  // Filtra as rotas que possuem as tags dos módulos fornecidos
  const filteredPaths = Object.entries(paths).filter(([path, methods]) =>
    Object.values(methods).some(method => method.tags && method.tags.some(tag => moduleNames.includes(tag)))
  );

  // Pega os schemas associados às rotas filtradas
  const relatedSchemas = {};
  filteredPaths.forEach(([path, methods]) => {
    Object.values(methods).forEach(method => {
      // Processa o requestBody
      if (method.requestBody && method.requestBody.content && method.requestBody.content['application/json']) {
        const requestBodySchemaRef = method.requestBody.content['application/json'].schema.$ref;
        if (requestBodySchemaRef) {
          const schemaName = requestBodySchemaRef.split('/').pop();
          relatedSchemas[schemaName] = components.schemas[schemaName];
        }
      }

      // Processa os responses
      if (method.responses) {
        Object.values(method.responses).forEach(response => {
          if (response.content && response.content['application/json']) {
            const responseSchemaRef = response.content['application/json'].schema.$ref;
            if (responseSchemaRef) {
              const schemaName = responseSchemaRef.split('/').pop();
              relatedSchemas[schemaName] = components.schemas[schemaName];
            }
          }
        });
      }
    });
  });

  return {
    openapi: openapi || '3.0.0',  // Inclui a versão do OpenAPI (usa '3.0.0' se não estiver especificada)
    info: info || { title: 'Dummy API', version: '1.0.0', description: 'Dummy description' },  // Adiciona dummy info se não houver
    security: security || [],  // Inclui a propriedade security, com um array vazio se não existir
    paths: Object.fromEntries(filteredPaths),
    components: {
      schemas: relatedSchemas,
      securitySchemes: components.securitySchemes || {}  // Inclui securitySchemes se existir, ou vazio
    }
  };
};

// Função principal para executar a CLI
const run = async () => {
  const swaggerData = await fetchSwaggerJSON(options.url);
  const moduleNames = options.modules.split(',').map(name => name.trim());

  // Valida os módulos antes de filtrar
  validateModules(swaggerData, moduleNames);

  const filteredData = filterByModules(swaggerData, moduleNames);

  if (options.output) {
    // Salva o resultado em um arquivo JSON
    fs.writeFileSync(options.output, JSON.stringify(filteredData, null, 2));
    console.log(`Resultado salvo em ${options.output}`);
  } else {
    // Exibe o resultado no console
    console.log(JSON.stringify(filteredData, null, 2));
  }
};

run();
