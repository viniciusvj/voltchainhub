# Política de Segurança

## Relatando vulnerabilidades

VoltchainHub lida com energia e dinheiro tokenizado. Vulnerabilidades podem significar roubo de LuzToken, falsificação de medição, ou comprometimento de dispositivos IoT em residências. Levamos isso a sério.

**Não abra Issue público para vulnerabilidades.** Use um destes canais:

- **GitHub Security Advisory:** https://github.com/viniciusvj/voltchainhub/security/advisories/new
- **E-mail direto:** v.jreis@hotmail.com (assunto: `[SECURITY] Voltchainhub — <resumo>`)

## Escopo

O que queremos saber:

- Vulnerabilidades em smart contracts (`contracts/`)
- Bugs em firmware ESP32-S3 que permitam injeção de medição falsa
- Problemas no OpenEMS bundle / S2 adapter que exponham dados do prosumidor
- Falhas de autenticação/autorização no backend
- XSS, CSRF, SSRF, SQLi no frontend/backend
- Dependências com CVE conhecido não mitigado

Fora de escopo (por enquanto):

- Ataques físicos ao dispositivo IoT (assumimos adversário com acesso local)
- Engenharia social contra operadores
- Spam ou DoS volumétrico
- Problemas em infraestrutura de terceiros (Polygon, Alchemy, etc.) — reporte direto a eles

## Processo

1. Você envia o relato pelo canal privado.
2. Confirmamos recebimento em até **72h úteis**.
3. Triagem e investigação em até **14 dias**.
4. Fix desenvolvido em privado. Se for crítico em contrato já deployado, discutimos junto plano de mitigação (pausa, upgrade, migração).
5. Coordenamos divulgação pública com você. Você recebe crédito (se quiser) no advisory e no release notes.

## Bug bounty

Ainda não há programa formal de bug bounty. Em v1.0 (mainnet) isso muda. Por enquanto: crédito público + apoio em networking + agradecimento genuíno.

## Commitment

- Não vamos processar pesquisadores agindo de boa-fé dentro deste escopo.
- Não vamos exigir NDA como pré-condição para reportar.
- Vamos tratar você como parceiro, não adversário.

Obrigado por ajudar a proteger prosumidores brasileiros.
