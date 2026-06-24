# 💍 CerimonIA – Assessoria de Casamento Inteligente

[**✨ Ver Demonstração Ao Vivo**](https://stehlima.github.io/cerimon-ia/)

A CerimonIA é uma plataforma premium de assessoria de casamento que utiliza Inteligência Artificial para automatizar as partes mais estressantes do planejamento: cotações com fornecedores, gestão financeira e cronograma.

![CerimonIA Hero](ceremon_ia_hero_1777897441885.png)

## ✨ Funcionalidades

- **🤖 Central de Agentes IA**: Agentes virtuais que negociam com fornecedores via WhatsApp e extraem orçamentos automaticamente.
- **💰 Gestor Financeiro Inteligente**: Controle de orçamentos vs. gastos reais, com alertas de desvio e gráfico de cashflow mensal.
- **📅 Planner com Roteiro Dinâmico**: Sugestão de roteiro baseada no horário da cerimônia e cálculo automático do pôr do sol.
- **📱 Concierge dos Noivos**: Assistente virtual integrado para responder dúvidas de convidados (local, traje, lista de presentes).
- **🔒 Autenticação Segura**: Integração com Supabase para login persistente e proteção de dados.
- **🎨 Moodboard Generativo**: Descreva seu estilo e a IA gera referências visuais e paletas de cores.

## 🚀 Tecnologias

- **Frontend**: HTML5, CSS3 (Vanilla com Glassmorphism), JavaScript (ES6+).
- **Backend/Auth**: [Supabase](https://supabase.com/).
- **Design**: Google Fonts (Cormorant Garamond & Inter).

## 🛠️ Configuração e Instalação

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/Stehlima/cerimon-ia.git
   ```

2. **Configure o Supabase**:
   - Crie um projeto no [Supabase](https://supabase.com/).
   - Desative "Confirm Email" em *Authentication > Providers > Email* (opcional para testes rápidos).
   - No arquivo `app.js`, substitua as variáveis de configuração:
     ```javascript
     const SUPABASE_URL = 'SUA_URL_AQUI';
     const SUPABASE_KEY = 'SUA_KEY_AQUI';
     ```

3. **Inicie o servidor**:
   Você pode usar qualquer servidor estático. Exemplo com `http-server`:
   ```bash
   npx http-server
   ```

## 📂 Estrutura de Arquivos

- `index.html`: Estrutura principal e modais da plataforma.
- `app.js`: Lógica de estado, integração com Supabase e renderização dinâmica.
- `style.css`: Design system, animações e layout responsivo.

## 📄 Licença

Este projeto é de uso privado para planejamento de casamentos de alta performance.

---
*Desenvolvido com ✨ por CerimonIA Team.*
