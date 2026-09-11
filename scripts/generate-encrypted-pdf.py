#!/usr/bin/env python3
"""
TVS VISERON — Gerador de PDF Encriptado
Todas as credenciais e acessos
"""
import os
import json
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from cryptography.fernet import Fernet

DATA_DIR = 'C:/Trinnity-Viseron-System/data/trading'
PDF_DIR = 'C:/Trinnity-Viseron-System/data'

# Chave de encriptacao (guardar separadamente!)
ENCRYPTION_KEY = Fernet.generate_key()
cipher = Fernet(ENCRYPTION_KEY)

def get_styles():
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=HexColor('#1a1a2e'),
        spaceAfter=20,
        alignment=TA_CENTER,
    )
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=HexColor('#e94560'),
        spaceBefore=20,
        spaceAfter=10,
    )
    
    subheader_style = ParagraphStyle(
        'CustomSubHeader',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=HexColor('#0f3460'),
        spaceBefore=10,
        spaceAfter=5,
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#16213e'),
        spaceBefore=5,
        spaceAfter=5,
    )
    
    warning_style = ParagraphStyle(
        'Warning',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#ff0000'),
        spaceBefore=5,
        spaceAfter=5,
    )
    
    return title_style, header_style, subheader_style, body_style, warning_style

def create_pdf(password):
    """Cria PDF encriptado com todas as credenciais"""
    
    pdf_file = os.path.join(PDF_DIR, 'Viseron_Credenciais_TVS.pdf')
    
    doc = SimpleDocTemplate(
        pdf_file,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
    )
    
    title_style, header_style, subheader_style, body_style, warning_style = get_styles()
    
    story = []
    
    # Titulo
    story.append(Paragraph('TVS VISERON - CREDENCIAIS COMPLETAS', title_style))
    story.append(Paragraph('Documento Encriptado - Confidencial', subheader_style))
    story.append(Paragraph(f'Gerado: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', body_style))
    story.append(Spacer(1, 1*cm))
    
    # WALLET SOLANA (Trading Principal)
    story.append(Paragraph('1. WALLET SOLANA - TRADING PRINCIPAL', header_style))
    story.append(Paragraph('Esta e a wallet utilizada para trading na Jupiter DEX', body_style))
    
    sol_data = [
        ['Campo', 'Valor'],
        ['Endereco', 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'],
        ['Chave Privada', '[26,40,37,248,151,195,132,140,228,71,42,231,45,153,87,222,135,6,179,63,106,122,88,43,114,156,240,187,235,151,154,34,144,191,192,78,41,209,63,77,59,137,130,19,169,83,17,51,200,4,37,69,232,144,226,179,12,250,30,121,49,245,154,230]'],
        ['Frase Seed', 'smoke piece enhance gauge oxygen author hybrid next nose worth bean hurt'],
        ['Rede', 'Solana Mainnet'],
        ['DEX', 'Jupiter (jup.ag)'],
        ['Status', 'ATIVA - Trading ativo'],
    ]
    
    sol_table = Table(sol_data, colWidths=[4*cm, 12*cm])
    sol_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#e94560')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#16213e')),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f0f0f0')),
    ]))
    story.append(sol_table)
    story.append(Spacer(1, 0.5*cm))
    
    # WALLET ETHEREUM
    story.append(Paragraph('2. WALLET ETHEREUM - DEX TRADING', header_style))
    story.append(Paragraph('Wallet Ethereum para trading na Uniswap', body_style))
    
    eth_data = [
        ['Campo', 'Valor'],
        ['Endereco', '0x0d76646cD1D2FaD174a317856A9D4B63F8491400'],
        ['Chave Privada', '4fb65a05a78ba12af9e141873cddd904f5ab05bb113815d0fa3897cb2617d037'],
        ['Frase Seed', 'inhale green rent core truth dragon glide prison nurse mammal calm rug'],
        ['Rede', 'Ethereum Mainnet'],
        ['DEX', 'Uniswap'],
        ['Router', '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'],
    ]
    
    eth_table = Table(eth_data, colWidths=[4*cm, 12*cm])
    eth_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#0f3460')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#16213e')),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f0f0f0')),
    ]))
    story.append(eth_table)
    story.append(Spacer(1, 0.5*cm))
    
    # ALPACA
    story.append(Paragraph('3. ALPACA PAPER TRADING', header_style))
    story.append(Paragraph('Conta de trading simulado com $100,000', body_style))
    
    alpaca_data = [
        ['Campo', 'Valor'],
        ['API Key', 'PK4F0K1PSQZQ5QD3TQ9D'],
        ['Secret Key', 'qD6r3pJ7gKj5sW4vR8tB2nX1yF6hL0mC3eD4fG7hJ'],
        ['Base URL', 'https://paper-api.alpaca.markets'],
        ['Portfolio', '$100,000 (simulado)'],
        ['Account ID', 'PA3B0I0CZF1I'],
    ]
    
    alpaca_table = Table(alpaca_data, colWidths=[4*cm, 12*cm])
    alpaca_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#533483')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#16213e')),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f0f0f0')),
    ]))
    story.append(alpaca_table)
    story.append(Spacer(1, 0.5*cm))
    
    # OKX
    story.append(Paragraph('4. OKX - ANALISE DE MERCADO', header_style))
    story.append(Paragraph('API publica para dados de mercado (sem chave necessaria)', body_style))
    
    okx_data = [
        ['Campo', 'Valor'],
        ['Tipo', 'API Publica (so leitura)'],
        ['Endpoint', 'https://www.okx.com/api/v5/market/ticker'],
        ['Uso', 'Precos, velas, indicadores'],
        ['Chave', 'Nao necessaria'],
    ]
    
    okx_table = Table(okx_data, colWidths=[4*cm, 12*cm])
    okx_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#e94560')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#16213e')),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f0f0f0')),
    ]))
    story.append(okx_table)
    story.append(Spacer(1, 0.5*cm))
    
    # TOKENS TVS
    story.append(Paragraph('5. TOKENS TVS (VSR + TRIN)', header_style))
    story.append(Paragraph('Tokens oficiais do TVS na Solana', body_style))
    
    tokens_data = [
        ['Token', 'Mint Address', 'Supply'],
        ['VSR', '7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU', '300,000,000'],
        ['TRIN', 'Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx', '420,690,000'],
    ]
    
    tokens_table = Table(tokens_data, colWidths=[2*cm, 10*cm, 4*cm])
    tokens_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#0f3460')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#16213e')),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f0f0f0')),
    ]))
    story.append(tokens_table)
    story.append(Spacer(1, 0.5*cm))
    
    # TOKENS TRADING
    story.append(Paragraph('6. TOKENS DE TRADING (Enderecos Solana)', header_style))
    
    trading_data = [
        ['Token', 'Mint Address'],
        ['JUP', 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'],
        ['RAY', '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'],
        ['WIF', 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'],
        ['BONK', 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'],
        ['PENGU', '2zMMhcVQ6D1SEjWrD6gRmjNDRkF1eFLcckage7NkVLry'],
        ['TRUMP', '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'],
    ]
    
    trading_table = Table(trading_data, colWidths=[2*cm, 14*cm])
    trading_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#e94560')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#16213e')),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f0f0f0')),
    ]))
    story.append(trading_table)
    story.append(Spacer(1, 1*cm))
    
    # SISTEMA
    story.append(Paragraph('7. SISTEMA TVS', header_style))
    
    sistema_data = [
        ['Componente', 'Detalhes'],
        ['Servidor', 'localhost:32123'],
        ['Dashboard', 'localhost:3000'],
        ['ATLAS', 'localhost:3000/atlas'],
        ['VISERON', 'localhost:3000/viseron'],
        ['Game', 'localhost:3000/game'],
        ['Cosmos', 'localhost:3000/cosmos'],
        ['API Health', 'localhost:32123/api/health'],
        ['Trading Bot', 'scripts/mega-scalper.py'],
        ['VPS Script', 'scripts/vps-setup.sh'],
    ]
    
    sistema_table = Table(sistema_data, colWidths=[4*cm, 12*cm])
    sistema_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#533483')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#16213e')),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f0f0f0')),
    ]))
    story.append(sistema_table)
    story.append(Spacer(1, 1*cm))
    
    # AVISO
    story.append(Paragraph('AVISO DE SEGURANCA', header_style))
    story.append(Paragraph('Este documento contem todas as chaves e senhas do sistema TVS.', warning_style))
    story.append(Paragraph('NUNCA partilhe este documento com terceiros.', warning_style))
    story.append(Paragraph('Guarde offline (papel/pendrive encriptado).', warning_style))
    story.append(Paragraph('Se comprometido, gere novas wallets imediatamente.', warning_style))
    
    # Build PDF
    doc.build(story)
    
    # Encripta PDF
    with open(pdf_file, 'rb') as f:
        pdf_data = f.read()
    
    encrypted = cipher.encrypt(pdf_data)
    
    encrypted_file = os.path.join(PDF_DIR, 'Viseron_Credenciais_TVS_ENCRYPTED.pdf')
    with open(encrypted_file, 'wb') as f:
        f.write(encrypted)
    
    # Guarda chave de encriptacao
    key_file = os.path.join(DATA_DIR, 'encryption_key.txt')
    with open(key_file, 'w') as f:
        f.write(ENCRYPTION_KEY.decode())
    
    # Remove PDF original (nao encriptado)
    os.remove(pdf_file)
    
    return encrypted_file, ENCRYPTION_KEY.decode()

if __name__ == '__main__':
    password = 'TVS_VISERON_2026'
    pdf_file, key = create_pdf(password)
    print('PDF ENCRYPTED: ' + pdf_file)
    print('ENCRYPTION KEY: ' + key)
    print('')
    print('Para desencriptar, use:')
    print('  python decrypt_pdf.py')
