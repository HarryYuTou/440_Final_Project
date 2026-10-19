# Personalized Coffee Discovery Through a World Map

**Capstone write-up — pre-implementation draft**  
**Date:** October 16, 2026 (updated October 19, 2026)

This draft contains the business question, problem definition, and a concise Product Requirements Document (PRD) describing the proposed solution. Features are described as planned. The final report will include the actual architecture, implementation, deployment, lessons learned, and next steps.

## 1. Business Question and Problem Definition

### 1.1 Business Question

**How can we help coffee-curious consumers without specialist knowledge discover and choose coffee beans and regional coffee drinks that suit their tastes and drinking habits, while understanding the reasons behind each recommendation and its geographic and cultural context?**

### 1.2 Target Users and Problem

Our proposed primary users enjoy coffee and want to explore unfamiliar options but lack specialist knowledge of origins, processing, flavors, and regional preparations. They may recognize preferences such as a creamy texture or fruity flavors without knowing which beans or drinks to choose.

The problem is translating coffee information into a personally relevant decision. Origin labels, tasting descriptions, and unfamiliar drink names may not answer the user's practical question: **“What should I try next, and why might I enjoy it?”**

For example, a user might say, “I usually drink milk coffee, prefer something slightly sweet, and want to try a different regional style.” The desired outcome is a manageable set of choices with understandable explanations of their suitability and background.

### 1.3 Why AI Is Appropriate

Users may describe their preferences in everyday language rather than technical coffee terminology. AI can help interpret those descriptions, connect them to relevant characteristics, and explain recommendations in accessible terms. It can also consider a combination of preferences and drinking habits when suggesting beans, regional drinks, or suitable pairings.

The proposed AI backend will therefore support the product's core value: helping users decide what to try and understand why it may suit them. Geographic browsing and curated information will provide the context for these recommendations. AI will also turn a user's preferences and saved items into a suggested future coffee trip: an ordered set of destinations chosen only from the curated catalog, each with a reason it fits the user.

## 2. Product Requirements Document (PRD)

### 2.1 Product Objective

The product will help users choose a bean profile or regional drink, understand its suitability, and explore its background. Recommendations will reflect taste preferences and drinking habits. The map will support discovery, while AI will connect preferences to choices grounded in curated information. AI recommendations answer what to drink; the AI trip map answers where to go to drink it.

### 2.2 Product Scope: Coffee Beans, Regional Drinks, and Geography

The product will distinguish three relationships:

- **Bean origin:** where a coffee is grown, with available information about its growing environment, variety, processing, and flavor characteristics.
- **Drink association:** the country or region associated with a preparation or drinking tradition. This does not automatically identify the origin of its beans.
- **Bean–drink pairing:** a documented customary combination or a suggested combination based on preparation and taste. Suggested pairings will be labeled separately from cultural facts.

Users will navigate from the world map to supported countries and curated regions. A location may contain beans, drinks, or both; geographic associations will not imply a uniform flavor profile.

### 2.3 Core User Journey

1. Explore the world map and open a supported country or region.
2. View associated bean profiles and drinks, including their characteristics and sources.
3. Register or sign in to save preferences and selections.
4. Describe preferences through accessible choices and optional natural-language input.
5. Review recommendations and explanations, following links between beans, drinks, and places.
6. Generate an AI trip map of future coffee destinations, shown as a route on the world map with a stop-by-stop list.
7. Save selections to the account and access the Stripe test payment flow.

### 2.4 Core Functional Requirements

| Feature | Planned functionality |
|---|---|
| User accounts | Registration and login, with saved personal preferences and coffee selections. |
| Interactive world map | Navigation from the world view to supported countries and regions. |
| Coffee and drink information | Descriptions of beans, growing environments, flavors, regional preparations, and cultural background, with relevant sources. |
| AI-powered recommendations | Suggestions for beans and drinks based on personal preferences, with explanations of suitability and relevant pairings. |
| AI trip map | A server-generated itinerary of future coffee destinations based on saved preferences and selections. Stops are limited to supported catalog countries and regions, validated on the server, drawn as a route on the world map, and listed with a recommendation and reason for each stop. |
| Payment integration | A working Stripe checkout flow in sandbox/test mode. |

### 2.5 AI and Error-Handling Requirements

The AI backend will use user preferences, the selected geographic context, and curated coffee information to produce recommendations. The trip map uses the same server-side AI service to select and order destinations from the catalog's supported countries and regions; any destination that is not in the catalog is rejected. The AI key stays on the server. Factual descriptions will be grounded in the available sources, and suggested pairings will be distinguished from documented traditions.

The product will account for unclear preferences, missing information, invalid AI output, and unavailable AI responses. It will request clarification or explain limitations when appropriate and provide understandable error messages for account and payment problems.

### 2.6 Deployment and Delivery Requirements

The planned product will be deployed at a public URL and support an end-to-end user experience, including registration, AI recommendations, the AI trip map, and Stripe test payments. The implementation will be maintained in a structured GitHub repository with a README, an architecture diagram, and explanations of key design decisions. The deployed product will support the team's live demonstration.
