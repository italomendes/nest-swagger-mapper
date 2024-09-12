#!/usr/bin/env node

const axios = require('axios');
const { program } = require('commander');
const fs = require('fs');

// Configura o Commander para receber o nome do módulo ou rota como parâmetro, além de title e description
program
  .version('1.0.0')
  .description('CLI para mapear o Swagger e retornar o JSON por rota ou módulo.')
  .option('-u, --url <url>', 'URL do Swagger JSON', 'http://localhost:3000/swagger-json')
  .option('-m, --modules <modules>', 'Nome(s) do(s) módulo(s) separados por vírgula')
  .option('-p, --path <paths>', 'Especificar uma ou mais URLs de rotas separadas por vírgulas')
  .option('-o, --output <file>', 'Salvar o resultado em um arquivo JSON')
  .option('-t, --title <title>', 'Título da API', 'Dummy API')
  .option('-d, --description <description>', 'Descrição da API', 'Dummy description')
  .parse(process.argv);

const options = program.opts();

if (!options.modules && !options.path) {
  console.error('Por favor, forneça o nome de um ou mais módulos com --modules ou uma ou mais URLs de rota com --path.');
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

// Função para validar se os módulos ou as rotas fornecidas existem no Swagger
const validateInput = (swaggerData, moduleNames, paths) => {
  const allTags = new Set();
  const allPaths = new Set(Object.keys(swaggerData.paths));

  // Coleta todas as tags existentes
  Object.values(swaggerData.paths).forEach((methods) => {
    Object.values(methods).forEach((method) => {
      if (method.tags) {
        method.tags.forEach((tag) => allTags.add(tag));
      }
    });
  });

  // Validação dos módulos
  if (moduleNames) {
    const invalidModules = moduleNames.filter((module) => !allTags.has(module));
    if (invalidModules.length > 0) {
      console.error(`Os seguintes módulos não existem no Swagger: ${invalidModules.join(', ')}`);
      process.exit(1);
    }
  }

  // Validação das URLs de rotas
  if (paths) {
    const invalidPaths = paths.filter((path) => !allPaths.has(path));
    if (invalidPaths.length > 0) {
      console.error(`As seguintes rotas fornecidas não existem no Swagger: ${invalidPaths.join(', ')}`);
      process.exit(1);
    }
  }
};

// Função para filtrar por módulos ou por rotas
const filterByInput = (swaggerData, moduleNames, paths) => {
  const { paths: swaggerPaths, components, openapi, info, security } = swaggerData;

  // Filtra rotas por módulo (tags) ou por URLs de rotas específicas
  const filteredPaths = moduleNames
    ? Object.entries(swaggerPaths).filter(([routePath, methods]) =>
        Object.values(methods).some(method => method.tags && method.tags.some(tag => moduleNames.includes(tag)))
      )
    : Object.entries(swaggerPaths).filter(([routePath]) => paths.includes(routePath));

  // Pega os schemas associados às rotas filtradas
  const relatedSchemas = {};
  filteredPaths.forEach(([routePath, methods]) => {
    Object.values(methods).forEach(method => {
      if (method.responses) {
        Object.values(method.responses).forEach(response => {
          if (response.content && response.content['application/json']) {
            const schemaRef = response.content['application/json'].schema.$ref;
            if (schemaRef) {
              const schemaName = schemaRef.split('/').pop();
              relatedSchemas[schemaName] = components.schemas[schemaName];
            }
          }
        });
      }
      if (method.requestBody) {
        const requestBodyContent = method.requestBody.content['application/json'];
        if (requestBodyContent && requestBodyContent.schema.$ref) {
          const schemaName = requestBodyContent.schema.$ref.split('/').pop();
          relatedSchemas[schemaName] = components.schemas[schemaName];
        }
      }
    });
  });

  return {
    openapi: openapi || '3.0.0',  // Inclui a versão do OpenAPI (usa '3.0.0' se não estiver especificada)
    info: {
      title: options.title,  // Usa o título fornecido ou um valor padrão
      description: options.description,  // Usa a descrição fornecida ou um valor padrão
      version: info ? info.version : '1.0.0'  // Se existir, mantém a versão da API do Swagger, ou define uma padrão
    },
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
  const moduleNames = options.modules ? options.modules.split(',').map(name => name.trim()) : null;
  const paths = options.path ? options.path.split(',').map(path => path.trim()) : null;

  // Valida os módulos ou as rotas antes de filtrar
  validateInput(swaggerData, moduleNames, paths);

  const filteredData = filterByInput(swaggerData, moduleNames, paths);

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
