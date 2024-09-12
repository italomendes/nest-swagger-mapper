
# Swagger Mapper CLI

**Version**: 0.1.0-beta

## Descrição

O **Swagger Mapper CLI** é uma ferramenta de linha de comando (CLI) que permite filtrar e mapear um arquivo Swagger JSON, retornando informações separadas por módulos ou rotas específicos. A ferramenta também salva o resultado filtrado em um arquivo JSON, com suporte para incluir os esquemas relacionados (`schemas`), informações de segurança (`security`, `securitySchemes`) e outros detalhes importantes como `info` e `paths`.

## Funcionalidades

- Busca o arquivo Swagger JSON de uma URL fornecida.
- Filtra rotas específicas por tags (módulos ou rotas) fornecidas.
- Retorna as rotas e os esquemas JSON filtrados.
- Inclui informações de segurança (`security`, `securitySchemes`).
- Suporte para `requestBody`, `responses`, `info` e versão do OpenAPI.
- Salva o resultado filtrado em um arquivo JSON, se especificado.
- Exibe o resultado no console ou em um arquivo de saída.

## Instalação

### Pré-requisitos

- Node.js (versão 12 ou superior)
- npm (Node Package Manager)

### Passo a Passo

1. Clone este repositório:

```bash
git clone https://github.com/seu-usuario/swagger-mapper-cli.git
cd swagger-mapper-cli
```

2. Instale as dependências do projeto:

```bash
npm install
```

3. Para instalar a ferramenta globalmente:

```bash
npm install -g .
```

## Ou instale via npm 

```bash
npm i nest-swagger-mapper
```

Agora a ferramenta estará disponível em seu sistema como `swagger-mapper`.

## Uso

Após a instalação, você pode usar a ferramenta através da linha de comando da seguinte forma:

### Comandos

```bash
swagger-mapper --modules <nomes-dos-modulos> --url <url-do-swagger-json> [opções]
```

### Exemplos

#### Exibir no console o mapeamento do Swagger JSON filtrado por dois módulos

```bash
swagger-mapper --modules users,products --url http://localhost:3000/swagger-json
```

#### Salvar o resultado filtrado em um arquivo JSON

```bash
swagger-mapper --modules orders,payments --url http://localhost:3000/swagger-json --output filtered-swagger.json
```

### Parâmetros

| Parâmetro  | Descrição                                                                 | Padrão                               |
|------------|---------------------------------------------------------------------------|--------------------------------------|
| `--url`    | A URL do Swagger JSON que será processado.                                | `http://localhost:3000/swagger-json` |
| `--modules`| Nomes dos módulos (ou rotas) a serem filtrados, separados por vírgulas.   | **Obrigatório**                      |
| `--output` | Caminho do arquivo onde o JSON filtrado será salvo.                       | Não salva em arquivo, mostra no console |

## Estrutura do JSON Gerado

O arquivo JSON filtrado gerado pela ferramenta segue a estrutura abaixo:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Dummy API",
    "version": "1.0.0",
    "description": "Dummy description"
  },
  "security": [],
  "paths": {
    "/api/users": {
      "get": {
        "tags": ["users"],
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "name": {
            "type": "string"
          }
        }
      }
    },
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  }
}
```

## Contribuição

Sinta-se à vontade para abrir issues e pull requests no repositório do GitHub. Suas contribuições são bem-vindas!
