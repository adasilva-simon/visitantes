# 🎪 SMEE Feira — Cadastro de Visitantes

Sistema web para cadastro de visitantes em estandes de feiras e eventos.  
Sem backend, sem instalação — Alber Silva - (31)9 9975-8194.

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---|---|
| **Cadastro** | Formulário completo: nome, e-mail, telefone, empresa, cargo, estande e temperatura do lead |
| **LGPD** | Dois consentimentos obrigatórios, base legal declarada, exclusão individual e em massa |
| **Dashboard** | KPIs em tempo real: total, leads quentes, taxa de conversão, gráficos por temperatura/estande/hora |
| **Lista** | Tabela filtrável com busca por nome, empresa ou e-mail |
| **Exportar CSV** | Relatório completo com dados de consentimento |
| **Firebase** | Integração opcional com Firestore para sincronizar entre dispositivos (gratuito) |
| **Chave de acesso** | Login por chave — sem necessidade de criar contas |

---

## 🚀 Publicar no GitHub Pages

1. Crie um repositório em github.com
2. Faça upload de todos os arquivos
3. Vá em **Settings → Pages → Source → main → / (root)**
4. Acesse `https://SEU-USUARIO.github.io/feira-visitantes/`

---

## 🔑 Chaves de acesso

Edite o arquivo **`keys.js`** para adicionar ou remover usuários:

```js
var ACCESS_KEYS = [
  { key: 'MINHA-CHAVE-AQUI', label: 'Estande A', expires: null },
  { key: 'OUTRA-CHAVE-2024', label: 'Coordenação', expires: '2024-12-31' }
];
```

### Chaves padrão incluídas

| Chave | Perfil |
|---|---|
| `FAIR-2024-SMEE-A1B2` | Estande A |
| `FAIR-2024-SMEE-C3D4` | Estande B |
| `FAIR-2024-SMEE-E5F6` | Estande C |
| `FAIR-2024-SMEE-G7H8` | Coordenação |
| `FAIR-2024-SMEE-X9Z0` | Acesso Temporário (expira 31/12/2025) |

---

## 🔥 Firebase (opcional)

Sem Firebase, os dados ficam no navegador (localStorage).  
Com Firebase, todos os dispositivos compartilham os mesmos registros em tempo real.

**Plano gratuito (Spark):** 50.000 leituras/dia · 20.000 escritas/dia · 1 GB

---

## 📋 Conformidade LGPD

- ✅ Consentimento explícito duplo antes de qualquer registro
- ✅ Finalidade declarada no formulário
- ✅ Exclusão individual e em massa disponíveis
- ✅ Exportação com dados de consentimento e timestamp
- ✅ Dados processados localmente — nada enviado sem Firebase configurado

---

## 📄 Licença

MIT — uso livre, inclusive comercial.
