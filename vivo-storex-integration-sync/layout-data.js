const COMMON_FIELDS = [
  {n:"operationType",t:"string",r:true,d:"Tipo da operação",vals:{"I":"Inclusão/Alteração","E":"Exclusão"}},
  {n:"registrationStatus",t:"string",r:true,d:"Status do registro. Enviar sempre \"NP\"",vals:{"NP":"Não Processado","PR":"Processado","EP":"Em Processamento","ER":"Processado com Erro"}},
  {n:"inclusionDate",t:"datetime",r:true,d:"Data/hora de inclusão. Formato: YYYY-MM-DD HH:MM:SS",ex:"2026-05-12 15:00:00"}
];

const LAYOUTS = [
  {
    id:"category-levels", order:1, title:"Níveis Mercadológicos",
    api:"POST /category-level/", table:"P2K_NIV_MERC",
    desc:"Define a estrutura hierárquica dos níveis mercadológicos que organizam as categorias de produtos.",
    prereqs:[], pk:"level",
    fields:[
      {n:"level",t:"integer",r:true,d:"Número do nível mercadológico",ex:"1, 2, 3, 4"},
      {n:"levelDescription",t:"string",r:true,d:"Descrição do nível",ex:"Departamento, Setor, Categoria"},
      {n:"digitsNumber",t:"integer",r:true,d:"Quantidade de dígitos que compõem o código deste nível",ex:"2 (permite até 99 itens)"},
      {n:"sectionIndicator",t:"string",r:false,d:"Indicador do nível da seção"}
    ],
    example:[
      {"level":1,"levelDescription":"Departamento","digitsNumber":2,"operationType":"I","registrationStatus":"NP","inclusionDate":"2026-05-12 15:00:00"},
      {"level":2,"levelDescription":"Setor","digitsNumber":2,"operationType":"I","registrationStatus":"NP","inclusionDate":"2026-05-12 15:00:00"}
    ],
    rules:[
      "O campo \"level\" é a chave primária do nível mercadológico.",
      "\"digitsNumber\" define a quantidade de posições no código. Ex: nível 1 com 2 dígitos e nível 2 com 2 dígitos gera código XX+YY (ex: \"0102\").",
      "Este cadastro deve ser feito ANTES do cadastro de categorias."
    ]
  },
  {
    id:"categories", order:2, title:"Categorias (Mercadológicos)",
    api:"POST /category/", table:"P2K_CAB_MERC",
    desc:"Define as categorias utilizadas para classificar os produtos, seguindo a hierarquia dos níveis mercadológicos.",
    prereqs:["category-levels"], pk:"marketCode",
    fields:[
      {n:"marketCode",t:"string",r:true,d:"Código do mercadológico (chave primária)",ex:"10, 1001, 1001001"},
      {n:"compactDescription",t:"string",r:true,d:"Descrição compacta (PDV/cupom fiscal)",ex:"SMARTPHONES"},
      {n:"fullDescription",t:"string",r:true,d:"Descrição completa",ex:"Smartphones e Celulares"},
      {n:"markup",t:"number",r:true,d:"Margem de lucro estimada (%). Enviar 0 se N/A",ex:"30.5"},
      {n:"extraPoints",t:"integer",r:true,d:"Pontos extras para clientes fidelizados. Enviar 0 se N/A",ex:"0"},
      {n:"marketCodeSup",t:"string",r:true,d:"Código do mercadológico pai na hierarquia. Vazio para nível 1 (raiz)",ex:"10"},
      {n:"allowCommission",t:"string",r:true,d:"Categoria comissionada",vals:{"S":"Sim","N":"Não"}}
    ],
    example:[
      {"marketCode":"10","compactDescription":"TEL MOVEL","fullDescription":"Telefonia Móvel","markup":0,"extraPoints":0,"marketCodeSup":"","allowCommission":"S","operationType":"I","registrationStatus":"NP","inclusionDate":"2026-05-12 15:00:00"},
      {"marketCode":"1001","compactDescription":"SMARTPHONES","fullDescription":"Smartphones e Celulares","markup":0,"extraPoints":0,"marketCodeSup":"10","allowCommission":"S","operationType":"I","registrationStatus":"NP","inclusionDate":"2026-05-12 15:00:00"}
    ],
    rules:[
      "\"marketCode\" é a chave primária da categoria.",
      "\"marketCodeSup\" estabelece a hierarquia pai-filho. Para nível 1, enviar vazio.",
      "A formação do \"marketCode\" deve seguir a estrutura de dígitos dos níveis mercadológicos.",
      "Não é possível excluir uma categoria que possua subcategorias ou produtos vinculados."
    ]
  },
  {
    id:"taxes", order:3, title:"Percentuais de Impostos",
    api:"POST /tax/", table:"P2K_PERC_IMP",
    desc:"Define os percentuais de impostos utilizados no cálculo tributário das mercadorias.",
    prereqs:[], pk:"taxType + taxCode",
    fields:[
      {n:"taxType",t:"string",r:true,d:"Tipo do imposto",vals:{"1":"ICMS","2":"ISS","3":"PIS","4":"COFINS","5":"ICMS Reduzido","6":"Redução (% redução de base)","7":"FCP","8":"% redução base efetiva","9":"ICMS efetiva","10":"ICMS Desoneração"}},
      {n:"taxCode",t:"number",r:true,d:"Código sequencial do percentual. Forma o identificador Tn (ex: taxCode=1 → T1)",ex:"1, 11, 13, 20"},
      {n:"taxPercentage",t:"number",r:true,d:"Percentual do imposto",ex:"18, 7.6, 1.65"}
    ],
    example:[
      {"taxType":"1","taxCode":1,"taxPercentage":18,"operationType":"I","registrationStatus":"NP","inclusionDate":"2026-05-12 15:00:00"},
      {"taxType":"3","taxCode":11,"taxPercentage":1.65,"operationType":"I","registrationStatus":"NP","inclusionDate":"2026-05-12 15:00:00"},
      {"taxType":"4","taxCode":13,"taxPercentage":7.6,"operationType":"I","registrationStatus":"NP","inclusionDate":"2026-05-12 15:00:00"}
    ],
    rules:[
      "A chave primária é a combinação de taxType + taxCode.",
      "O campo taxCode gera o identificador \"Tn\" (ex: taxCode=1 → \"T1\").",
      "Esses códigos \"Tn\" são referenciados em product-stores (taxationCode) e products (pisCode, cofinsCode).",
      "Não é possível excluir um imposto vinculado a produtos."
    ]
  },
  {
    id:"products", order:4, title:"Cadastro de Produtos",
    api:"POST /product/", table:"P2K_CAB_PRODUTO",
    desc:"Define o cadastro básico dos produtos: descrição, código de barras principal, classificação fiscal (NCM), mercadológico, embalagem e referências PIS/COFINS.",
    prereqs:["category-levels","categories","taxes"], pk:"internalCode",
    fields:[
      {n:"internalCode",t:"integer",r:true,d:"Código interno do produto (chave primária)",ex:"100001"},
      {n:"verifDigit",t:"integer",r:true,d:"Dígito verificador (módulo 11)",ex:"0"},
      {n:"externalCode",t:"string",r:true,d:"Código externo (sistema legado)",ex:"VIVO-100001"},
      {n:"fullDescription",t:"string",r:true,d:"Descrição completa do produto",ex:"SMARTPHONE SAMSUNG GALAXY A55 5G 128GB"},
      {n:"compactDescription",t:"string",r:true,d:"Descrição compacta (cupom fiscal PDV)",ex:"SAMSUNG GALAXY A55 5G"},
      {n:"marketingCode",t:"string",r:true,d:"Código mercadológico. Ref: categories",ex:"1001001"},
      {n:"origin",t:"string",r:true,d:"Origem da mercadoria",vals:{"0":"Nacional","1":"Estrangeira - Import. direta","2":"Estrangeira - Merc. interno"}},
      {n:"autCodeType",t:"string",r:true,d:"Tipo do código de automação",vals:{"1":"EAN 13","2":"Módulo 11","3":"UPC-A","4":"UPC-E","5":"EAN 8","6":"DUN14"}},
      {n:"automationCode",t:"integer",r:true,d:"Código de barras principal",ex:"7891010571313"},
      {n:"indGtin",t:"string",r:true,d:"Código GTIN válido?",vals:{"S":"Sim","N":"Não"}},
      {n:"ncmCode",t:"integer",r:true,d:"Código NCM (Nomenclatura Comum do Mercosul)",ex:"85171400"},
      {n:"salesPackaging",t:"string",r:true,d:"Embalagem de venda",vals:{"UN":"Unidade","PA":"Pacote","PC":"Peça","CX":"Caixa"}},
      {n:"unitContent",t:"string",r:true,d:"Unidade do conteúdo",vals:{"NH":"Nenhum","UN":"Unidade","PC":"Peça","GR":"Grama","ML":"Mililitro"}},
      {n:"purchasePack",t:"string",r:true,d:"Embalagem de compra",vals:{"UN":"Unidade","PC":"Peça","CX":"Caixa"}},
      {n:"productType",t:"string",r:true,d:"Tipo do produto",vals:{"01":"Normal","03":"Peso variável","14":"Serviços"}},
      {n:"elementType",t:"string",r:true,d:"Tipo de elemento",vals:{"0":"Normal","1":"Composto (Matriz)","2":"Composto (Loja)","8":"Bundle"}},
      {n:"pisCode",t:"integer",r:true,d:"Código do percentual PIS. Ref: taxes (taxType=3)",ex:"11"},
      {n:"cofinsCode",t:"integer",r:true,d:"Código do percentual COFINS. Ref: taxes (taxType=4)",ex:"13"}
    ],
    optionalFields:[
      {n:"indImeiControl",t:"string",d:"Solicita IMEI na venda",vals:{"S":"Obrigatório","N":"Não obrigatório","D":"Não solicita"}},
      {n:"indUniqueIdentifier",t:"string",d:"Exige identificador único",vals:{"S":"Sim","N":"Não"}},
      {n:"uniqueIdentifierType",t:"integer",d:"Tipo do identificador",vals:{"1":"Serial","2":"IMEI","3":"ICCID"}},
      {n:"brandName",t:"string",d:"Marca do produto",ex:"Samsung, Apple, Motorola"},
      {n:"grossWeight",t:"string",d:"Peso bruto (kg)"},
      {n:"netWeight",t:"string",d:"Peso líquido (kg)"}
    ],
    example:[
      {"internalCode":100001,"verifDigit":0,"externalCode":"VIVO-100001","fullDescription":"SMARTPHONE SAMSUNG GALAXY A55 5G 128GB AZUL","compactDescription":"SAMSUNG GALAXY A55 5G","marketingCode":"1001001","origin":"0","autCodeType":"1","automationCode":7891010571313,"indGtin":"S","elementType":"0","ncmCode":85171400,"salesPackaging":"UN","unitContent":"NH","purchasePack":"UN","productType":"01","pisCode":11,"cofinsCode":13,"indImeiControl":"S","uniqueIdentifierType":2,"brandName":"Samsung","operationType":"I","registrationStatus":"NP","inclusionDate":"2026-05-12 15:00:00"}
    ],
    rules:[
      "\"internalCode\" é a chave primária do produto.",
      "\"marketingCode\" deve referenciar um código existente em categories.",
      "\"pisCode\" e \"cofinsCode\" referenciam taxCode em taxes.",
      "Para TELECOM: indImeiControl=\"S\" para celulares, uniqueIdentifierType=2 (IMEI) para celulares, 3 (ICCID) para chips.",
      "Não é possível excluir produto com vínculos em product-stores ou product-barcodes."
    ]
  },
  {
    id:"product-barcodes", order:5, title:"Códigos de Barras Adicionais",
    api:"POST /product-barcode/", table:"P2K_AUT_PRODUTO",
    desc:"Cadastra códigos de barras adicionais para produtos que possuem múltiplos códigos (embalagens diferentes, códigos internos, migração).",
    prereqs:["products"], pk:"automationCode + productCode",
    fields:[
      {n:"automationCode",t:"integer",r:true,d:"Código de barras/automação (chave primária com productCode)",ex:"17891010571310"},
      {n:"productCode",t:"integer",r:true,d:"Código interno do produto. Ref: products.internalCode",ex:"100001"},
      {n:"verifDigit",t:"integer",r:true,d:"Dígito verificador (módulo 11)",ex:"0"},
      {n:"autCodeType",t:"string",r:true,d:"Tipo do código",vals:{"1":"EAN 13","2":"Módulo 11","3":"UPC-A","4":"UPC-E","5":"EAN 8","6":"DUN14","7":"EAN 13 Próprio","9":"Sem DV"}},
      {n:"salesPackaging",t:"string",r:true,d:"Embalagem de venda deste código",vals:{"UN":"Unidade","PA":"Pacote","CX":"Caixa","FD":"Fardo","PC":"Peça"}},
      {n:"salesPackagingQuant",t:"number",r:true,d:"Quantidade na embalagem",ex:"1, 6, 12, 50"},
      {n:"indGtin",t:"string",r:true,d:"Código GTIN válido?",vals:{"S":"Sim","N":"Não"}}
    ],
    example:[
      {"automationCode":17891010571310,"productCode":100001,"verifDigit":0,"autCodeType":"6","salesPackaging":"CX","salesPackagingQuant":6,"indGtin":"S","operationType":"I","registrationStatus":"NP","inclusionDate":"2026-05-12 15:00:00"}
    ],
    rules:[
      "Chave primária: automationCode + productCode.",
      "O productCode deve existir previamente em products.",
      "Um mesmo produto pode ter N códigos de barras.",
      "autCodeType \"7\" (EAN 13 Próprio) permite códigos internos sem validação GTIN.",
      "autCodeType \"9\" (Sem DV) armazena o código completo, sem remover o dígito verificador."
    ]
  },
  {
    id:"product-stores", order:6, title:"Produto × Loja (Habilitação e Tributação)",
    api:"POST /product-store/", table:"P2K_LJ_PRODUTO",
    desc:"Associa um produto a uma loja específica, definindo tributação, situação, preços e indicadores fiscais. Sem este cadastro, o produto NÃO estará disponível no PDV.",
    prereqs:["products","taxes"], pk:"storeCode + productCode",
    fields:[
      {n:"storeCode",t:"number",r:true,d:"Código da loja (chave primária com productCode)",ex:"1071"},
      {n:"productCode",t:"number",r:true,d:"Código interno do produto. Ref: products.internalCode",ex:"100001"},
      {n:"verifyingDigit",t:"number",r:true,d:"Dígito verificador",ex:"0"},
      {n:"taxationType",t:"string",r:true,d:"Tipo da tributação",vals:{"T":"Tributado","I":"Isento","N":"Não tributado","F":"Substituição Tributária","S":"ISS"}},
      {n:"taxationCode",t:"number",r:true,d:"Código da tributação (taxCode). Ref: taxes. Obrigatório se taxationType=T ou S",ex:"1"},
      {n:"pisExemption",t:"string",r:true,d:"Isenção PIS",vals:{"0":"Não isento","1":"Isento"}},
      {n:"cofinsExemption",t:"string",r:true,d:"Isenção COFINS",vals:{"0":"Não isento","1":"Isento"}},
      {n:"productSituation",t:"string",r:true,d:"Situação do produto na loja",vals:{"N":"Normal (ativo)","D":"Descontinuado","E":"Excluído (bloqueado)"}},
      {n:"cst",t:"number",r:true,d:"Código de Situação Tributária",vals:{"0":"Tributação integral","10":"ST","20":"Redução BC","40":"Isento","41":"Não tributado","90":"Outras"}},
      {n:"companyCode",t:"string",r:true,d:"Código da empresa",ex:"00001"},
      {n:"aliqFcpValue",t:"number",r:true,d:"% ICMS relativo ao FCP. Enviar 0 se N/A",ex:"2"}
    ],
    optionalFields:[
      {n:"practicedPrice",t:"number",d:"Preço praticado na loja",ex:"1899.99"},
      {n:"costPrice",t:"number",d:"Preço de custo",ex:"1200.00"},
      {n:"promotionPrice",t:"number",d:"Preço de promoção"},
      {n:"flagPromotion",t:"string",d:"Indicador de promoção",vals:{"0":"Sem promoção","1":"Em promoção","2":"Retirar promoção"}}
    ],
    example:[
      {"storeCode":1071,"productCode":100001,"verifyingDigit":0,"taxationType":"T","taxationCode":1,"pisExemption":"0","cofinsExemption":"0","productSituation":"N","cst":0,"companyCode":"00001","aliqFcpValue":2,"practicedPrice":1899.99,"costPrice":1200.00,"operationType":"I","registrationStatus":"NP","inclusionDate":"2026-05-12 15:00:00"}
    ],
    rules:[
      "Chave primária: storeCode + productCode.",
      "O productCode deve existir em products. O taxationCode deve existir em taxes.",
      "Um mesmo produto pode ter tributação diferente por loja/UF.",
      "productSituation=\"E\" bloqueia o produto no PDV daquela loja.",
      "Para promoção (flagPromotion=1), preencher startDatePromotion, endDatePromotion e promotionPrice."
    ]
  },
  {
    id:"product-price-validities", order:7, title:"Vigência de Preços",
    api:"POST /product-price-validity/", table:"P2K_VIGENCIA_PRECO",
    desc:"Define preços com vigência (data início/fim) para cada produto em cada loja. Controla preço normal, promocional, de concorrência e diferenciado por parceiro.",
    prereqs:["products","product-stores"], pk:"internalCode + storeCode + effectiveStartDate + priceType + partnerCode",
    fields:[
      {n:"internalCode",t:"integer",r:true,d:"Código interno do produto. Ref: products",ex:"100001"},
      {n:"storeCode",t:"integer",r:true,d:"Código da loja",ex:"1071"},
      {n:"effectiveStartDate",t:"datetime",r:true,d:"Data/hora INÍCIO da vigência. Formato: YYYY-MM-DD HH:MM",ex:"2026-05-12 00:00"},
      {n:"effectiveEndDate",t:"datetime",r:true,d:"Data/hora FIM da vigência. Para indeterminado: 2099-12-31 00:00",ex:"2099-12-31 00:00"},
      {n:"externalCode",t:"string",r:false,d:"Código externo (informativo)",ex:"VIVO-100001"},
      {n:"price",t:"number",r:true,d:"Preço a ser praticado durante a vigência",ex:"1899.99"},
      {n:"automationCode",t:"string",r:true,d:"Código de barras do produto",ex:"7891010571313"},
      {n:"priceType",t:"string",r:true,d:"Tipo do preço",vals:{"1":"Normal","2":"Promoção","3":"Concorrência"}},
      {n:"partnerCode",t:"integer",r:true,d:"Código do parceiro. Enviar 0 quando não há parceiro",ex:"0"},
      {n:"effectiveReasonCode",t:"integer",r:false,d:"Código de motivo da vigência (informativo)"}
    ],
    example:[
      {"internalCode":100001,"storeCode":1071,"effectiveStartDate":"2026-05-12 00:00","effectiveEndDate":"2099-12-31 00:00","externalCode":"VIVO-100001","price":1899.99,"automationCode":"7891010571313","priceType":"1","partnerCode":0,"operationType":"I","registrationStatus":"NP","inclusionDate":"2026-05-12 15:00:00"}
    ],
    rules:[
      "Chave primária composta: internalCode + storeCode + effectiveStartDate + priceType + partnerCode.",
      "O produto deve estar habilitado na loja via product-stores.",
      "Para vigência indeterminada, usar effectiveEndDate = \"2099-12-31 00:00\".",
      "Tipo 2 (Promoção) tem prioridade sobre Tipo 1 (Normal) no PDV.",
      "Quando há sobreposição de vigências do mesmo tipo, aplica-se o mais recente.",
      "Para partnerCode > 0, é necessário cadastro prévio em P2K_AGRUP (tipo_agrupamento=3)."
    ]
  }
];
