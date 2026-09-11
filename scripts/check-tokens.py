import json, urllib.request

wallet = 'Ak3J4hps9zAJiDzghkPRb1kqkPKDjg89d3jjM8tjcLVj'
vsr_mint = '7oR3jdwsxWUBeXqoyKX3ZTtVoKWqkBwEQteDEAWtvGQU'
trin_mint = 'Co7NeuQtcACw9bDHYwB3H58XyRenV5zfRp9jwH4zyQBx'

print('=== TOKENS NA BLOCKCHAIN ===')
print('')

for name, mint in [('VSR', vsr_mint), ('TRIN', trin_mint)]:
    payload = json.dumps({
        'jsonrpc': '2.0',
        'id': 1,
        'method': 'getTokenAccountsByOwner',
        'params': [
            wallet,
            {'mint': mint},
            {'encoding': 'jsonParsed'}
        ]
    })
    req = urllib.request.Request('https://api.mainnet-beta.solana.com', data=payload.encode(), headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
        accounts = data.get('result', {}).get('value', [])
        if accounts:
            for acc in accounts:
                info = acc['account']['data']['parsed']['info']
                amount = int(info['tokenAmount']['amount']) / 1e9
                print(name + ': ' + str(int(amount)) + ' tokens')
        else:
            print(name + ': NO ACCOUNT - need to create ATA')
