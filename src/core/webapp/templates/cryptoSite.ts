export function cryptoSiteTemplate(
  tokenName: string,
  tokenSymbol: string,
  description: string
): { html: string; css: string; js: string } {
  const html = `
<!-- Hero Section -->
<section id="hero" class="relative min-h-screen flex items-center justify-center overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900"></div>
  <div class="absolute inset-0 opacity-30">
    <div class="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
    <div class="absolute top-40 right-20 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl animate-pulse" style="animation-delay: 1s"></div>
    <div class="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500 rounded-full filter blur-3xl animate-pulse" style="animation-delay: 2s"></div>
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]"></div>
  </div>
  <div class="relative z-10 text-center px-4 max-w-5xl mx-auto">
    <div class="inline-block px-4 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-purple-300 mb-6 border border-purple-500/30">
      Next Generation Crypto Token
    </div>
    <h1 class="text-6xl md:text-8xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 text-transparent bg-clip-text leading-tight">
      ${tokenName}
    </h1>
    <p class="text-2xl md:text-3xl font-bold text-yellow-400 mb-6 tracking-wider">$${tokenSymbol}</p>
    <p class="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
      ${description}
    </p>
    <div class="flex flex-wrap justify-center gap-4 mb-16">
      <a href="#" class="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl shadow-purple-600/40 inline-block">
        Buy ${tokenSymbol} Now
      </a>
      <a href="#" class="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-all inline-block">
        Connect Wallet
      </a>
      <a href="#" class="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl font-bold text-lg hover:bg-white/10 transition-all inline-block">
        Whitepaper
      </a>
    </div>
    <div class="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-8 max-w-3xl mx-auto">
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        <p class="text-2xl md:text-3xl font-bold text-purple-400" id="priceDisplay">$0.042</p>
        <p class="text-xs text-gray-400 mt-1">Current Price</p>
      </div>
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        <p class="text-2xl md:text-3xl font-bold text-purple-400">$42.6M</p>
        <p class="text-xs text-gray-400 mt-1">Market Cap</p>
      </div>
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        <p class="text-2xl md:text-3xl font-bold text-purple-400">1,000M</p>
        <p class="text-xs text-gray-400 mt-1">Total Supply</p>
      </div>
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        <p class="text-2xl md:text-3xl font-bold text-purple-400">12.4K</p>
        <p class="text-xs text-gray-400 mt-1">Holders</p>
      </div>
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 col-span-3 md:col-span-1">
        <p class="text-2xl md:text-3xl font-bold text-green-400" id="changeDisplay">+2.5%</p>
        <p class="text-xs text-gray-400 mt-1">24h Change</p>
      </div>
    </div>
  </div>
  <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
    <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
    </svg>
  </div>
</section>

<!-- Tokenomics Section -->
<section id="tokenomics" class="py-24 px-4 bg-gray-800/30">
  <div class="max-w-5xl mx-auto">
    <h2 class="text-4xl md:text-5xl font-bold text-center mb-4">Tokenomics</h2>
    <p class="text-gray-400 text-center mb-16 max-w-xl mx-auto">Our token distribution model ensures long-term sustainability and community growth.</p>
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div class="flex justify-center">
        <div class="relative w-72 h-72">
          <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ef4444" stroke-width="3.8" stroke-dasharray="10, 100"/>
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" stroke-width="3.8" stroke-dasharray="15, 100" stroke-dashoffset="-10"/>
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22c55e" stroke-width="3.8" stroke-dasharray="20, 100" stroke-dashoffset="-25"/>
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eab308" stroke-width="3.8" stroke-dasharray="10, 100" stroke-dashoffset="-45"/>
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#a855f7" stroke-width="3.8" stroke-dasharray="25, 100" stroke-dashoffset="-55"/>
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ec4899" stroke-width="3.8" stroke-dasharray="20, 100" stroke-dashoffset="-80"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <p class="text-3xl font-bold text-white">${tokenSymbol}</p>
              <p class="text-xs text-gray-400">Total Supply</p>
            </div>
          </div>
        </div>
      </div>
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><div class="w-4 h-4 rounded bg-red-500"></div><span class="flex-1">Team (10% - 24mo lock)</span><span class="font-bold">10%</span></div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><div class="w-4 h-4 rounded bg-blue-500"></div><span class="flex-1">Marketing</span><span class="font-bold">15%</span></div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><div class="w-4 h-4 rounded bg-green-500"></div><span class="flex-1">Liquidity</span><span class="font-bold">20%</span></div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><div class="w-4 h-4 rounded bg-yellow-500"></div><span class="flex-1">Development</span><span class="font-bold">10%</span></div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><div class="w-4 h-4 rounded bg-purple-500"></div><span class="flex-1">Staking Rewards</span><span class="font-bold">25%</span></div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"><div class="w-4 h-4 rounded bg-pink-500"></div><span class="flex-1">Community</span><span class="font-bold">20%</span></div>
      </div>
    </div>
  </div>
</section>

<!-- Roadmap Section -->
<section id="roadmap" class="py-24 px-4">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-4xl md:text-5xl font-bold text-center mb-4">Roadmap</h2>
    <p class="text-gray-400 text-center mb-16 max-w-xl mx-auto">Our journey to revolutionize the crypto space.</p>
    <div class="grid md:grid-cols-4 gap-6">
      <div class="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group">
        <span class="text-purple-400 text-sm font-bold">Q1 2026</span>
        <h3 class="text-xl font-bold mt-2 mb-4 group-hover:text-purple-400 transition-colors">Launch</h3>
        <ul class="space-y-3">
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> Token creation</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> Community building</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> Smart contract audit</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> DEX listing</li>
        </ul>
      </div>
      <div class="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group">
        <span class="text-purple-400 text-sm font-bold">Q2 2026</span>
        <h3 class="text-xl font-bold mt-2 mb-4 group-hover:text-purple-400 transition-colors">Growth</h3>
        <ul class="space-y-3">
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> CEX listings</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> Marketing campaign</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> Partnership announcements</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> DAO formation</li>
        </ul>
      </div>
      <div class="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group">
        <span class="text-purple-400 text-sm font-bold">Q3 2026</span>
        <h3 class="text-xl font-bold mt-2 mb-4 group-hover:text-purple-400 transition-colors">Ecosystem</h3>
        <ul class="space-y-3">
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> Staking platform</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> Governance portal</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> Mobile app launch</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> Cross-chain bridge</li>
        </ul>
      </div>
      <div class="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group">
        <span class="text-purple-400 text-sm font-bold">Q4 2026</span>
        <h3 class="text-xl font-bold mt-2 mb-4 group-hover:text-purple-400 transition-colors">Expansion</h3>
        <ul class="space-y-3">
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> NFT marketplace</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> DeFi integration</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> Global expansion</li>
          <li class="flex items-start gap-2 text-sm text-gray-300"><span class="text-green-400 mt-0.5">✓</span> Mainnet upgrade</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- Team Section -->
<section id="team" class="py-24 px-4 bg-gray-800/30">
  <div class="max-w-5xl mx-auto">
    <h2 class="text-4xl md:text-5xl font-bold text-center mb-4">Our Team</h2>
    <p class="text-gray-400 text-center mb-16 max-w-xl mx-auto">The minds behind the revolution.</p>
    <div class="grid md:grid-cols-4 gap-6">
      <div class="group bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-600/30">PC</div>
        <h3 class="font-bold text-lg">Pedro Costa</h3>
        <p class="text-sm text-gray-400">Commander & CEO</p>
      </div>
      <div class="group bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-2">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-pink-600/30">TH</div>
        <h3 class="font-bold text-lg">Trinnity Hurtado</h3>
        <p class="text-sm text-gray-400">Queen & Architect</p>
      </div>
      <div class="group bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-600/30">AV</div>
        <h3 class="font-bold text-lg">Alex Venture</h3>
        <p class="text-sm text-gray-400">Lead Developer</p>
      </div>
      <div class="group bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center hover:border-green-500/50 transition-all duration-300 hover:-translate-y-2">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-green-600/30">SM</div>
        <h3 class="font-bold text-lg">Sarah Moon</h3>
        <p class="text-sm text-gray-400">Marketing Director</p>
      </div>
    </div>
  </div>
</section>

<!-- FAQ Section -->
<section id="faq" class="py-24 px-4">
  <div class="max-w-3xl mx-auto">
    <h2 class="text-4xl md:text-5xl font-bold text-center mb-4">FAQ</h2>
    <p class="text-gray-400 text-center mb-16 max-w-xl mx-auto">Frequently asked questions about ${tokenName}.</p>
    <div class="space-y-4" id="faqContainer">
      <div class="faq-item bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300">
        <button class="faq-question w-full px-6 py-5 text-left font-medium flex justify-between items-center hover:bg-white/5 transition-colors" onclick="toggleFaq(this)">
          <span>What is ${tokenName}?</span>
          <svg class="faq-icon w-5 h-5 text-purple-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div class="faq-answer hidden px-6 pb-5 text-gray-400 leading-relaxed">
          ${tokenName} (${tokenSymbol}) is a next-generation cryptocurrency token built on cutting-edge blockchain technology. It offers innovative features including staking rewards, governance participation, and a deflationary mechanism.
        </div>
      </div>
      <div class="faq-item bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300">
        <button class="faq-question w-full px-6 py-5 text-left font-medium flex justify-between items-center hover:bg-white/5 transition-colors" onclick="toggleFaq(this)">
          <span>How can I buy ${tokenSymbol}?</span>
          <svg class="faq-icon w-5 h-5 text-purple-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div class="faq-answer hidden px-6 pb-5 text-gray-400 leading-relaxed">
          You can purchase ${tokenSymbol} on supported DEXs and CEXs. Simply connect your wallet (MetaMask, WalletConnect, etc.), swap ETH/USDT for ${tokenSymbol}, and you're ready to go. Check our "Buy" section for direct purchase options.
        </div>
      </div>
      <div class="faq-item bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300">
        <button class="faq-question w-full px-6 py-5 text-left font-medium flex justify-between items-center hover:bg-white/5 transition-colors" onclick="toggleFaq(this)">
          <span>What is the total supply?</span>
          <svg class="faq-icon w-5 h-5 text-purple-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div class="faq-answer hidden px-6 pb-5 text-gray-400 leading-relaxed">
          The total supply of ${tokenSymbol} is 1,000,000,000 tokens. Our deflationary mechanism burns 1% of every transaction, reducing supply over time and creating scarcity for long-term holders.
        </div>
      </div>
      <div class="faq-item bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300">
        <button class="faq-question w-full px-6 py-5 text-left font-medium flex justify-between items-center hover:bg-white/5 transition-colors" onclick="toggleFaq(this)">
          <span>Is the contract audited?</span>
          <svg class="faq-icon w-5 h-5 text-purple-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div class="faq-answer hidden px-6 pb-5 text-gray-400 leading-relaxed">
          Yes, our smart contract has been audited by leading security firms. We prioritize safety and transparency above all else. The audit reports are publicly available in our documentation.
        </div>
      </div>
      <div class="faq-item bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300">
        <button class="faq-question w-full px-6 py-5 text-left font-medium flex justify-between items-center hover:bg-white/5 transition-colors" onclick="toggleFaq(this)">
          <span>How do I stake my tokens?</span>
          <svg class="faq-icon w-5 h-5 text-purple-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div class="faq-answer hidden px-6 pb-5 text-gray-400 leading-relaxed">
          Stake your ${tokenSymbol} tokens in our staking platform to earn passive rewards. Choose from flexible lockup periods (30, 90, 180, or 365 days) with APY rates up to 25%. Rewards are distributed daily.
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="border-t border-gray-800 py-16 px-4 bg-gray-900/50">
  <div class="max-w-5xl mx-auto">
    <div class="grid md:grid-cols-4 gap-8 mb-12">
      <div class="col-span-2">
        <h3 class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text mb-4">${tokenName}</h3>
        <p class="text-gray-400 max-w-md">${description}</p>
      </div>
      <div>
        <h4 class="font-bold mb-4">Quick Links</h4>
        <ul class="space-y-2 text-sm text-gray-400">
          <li><a href="#hero" class="hover:text-purple-400 transition-colors">Home</a></li>
          <li><a href="#tokenomics" class="hover:text-purple-400 transition-colors">Tokenomics</a></li>
          <li><a href="#roadmap" class="hover:text-purple-400 transition-colors">Roadmap</a></li>
          <li><a href="#team" class="hover:text-purple-400 transition-colors">Team</a></li>
          <li><a href="#faq" class="hover:text-purple-400 transition-colors">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold mb-4">Community</h4>
        <ul class="space-y-2 text-sm text-gray-400">
          <li><a href="#" class="hover:text-purple-400 transition-colors">Twitter / X</a></li>
          <li><a href="#" class="hover:text-purple-400 transition-colors">Telegram</a></li>
          <li><a href="#" class="hover:text-purple-400 transition-colors">Discord</a></li>
          <li><a href="#" class="hover:text-purple-400 transition-colors">GitHub</a></li>
          <li><a href="#" class="hover:text-purple-400 transition-colors">Medium</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
      &copy; ${new Date().getFullYear()} ${tokenName}. All rights reserved. | Built on Trinnity Viseron System
    </div>
  </div>
</footer>
`;

  const css = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { background: #0f172a; color: #e2e8f0; font-family: 'Inter', system-ui, -apple-system, sans-serif; overflow-x: hidden; }
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #0f172a; }
::-webkit-scrollbar-thumb { background: #4c1d95; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #6d28d9; }
@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
@keyframes pulse-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
@keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
.animate-float { animation: float 6s ease-in-out infinite; }
.animate-glow { animation: pulse-glow 3s ease-in-out infinite; }
.animate-gradient { background-size: 200% 200%; animation: gradient-shift 8s ease infinite; }
.faq-item.active { border-color: #a855f7; }
`;

  const js = `
function toggleFaq(button) {
  var item = button.closest('.faq-item');
  var answer = item.querySelector('.faq-answer');
  var icon = item.querySelector('.faq-icon');
  var isHidden = answer.classList.contains('hidden');
  document.querySelectorAll('.faq-item').forEach(function(el) {
    if (el !== item) {
      el.querySelector('.faq-answer').classList.add('hidden');
      el.querySelector('.faq-icon').classList.remove('rotate-180');
      el.classList.remove('active');
    }
  });
  if (isHidden) {
    answer.classList.remove('hidden');
    icon.classList.add('rotate-180');
    item.classList.add('active');
  } else {
    answer.classList.add('hidden');
    icon.classList.remove('rotate-180');
    item.classList.remove('active');
  }
}

function simulatePrice() {
  var priceEl = document.getElementById('priceDisplay');
  var changeEl = document.getElementById('changeDisplay');
  if (priceEl) {
    var base = 0.042;
    var change = (Math.random() - 0.5) * 0.004;
    var newPrice = base + change;
    priceEl.textContent = '$' + newPrice.toFixed(4);
    if (changeEl) {
      var pct = (change / base) * 100;
      changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
      changeEl.className = (pct >= 0 ? 'text-green-400' : 'text-red-400');
    }
  }
}
setInterval(simulatePrice, 5000);

document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    var target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
`;

  return { html, css, js };
}
