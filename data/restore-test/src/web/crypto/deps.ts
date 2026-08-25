import { createCryptoExchange } from "../../core/crypto/exchange";
import { CryptoPayments } from "../../core/crypto/payments";
import { AccountStore } from "../auth/store";
import { ILogger } from "../monitoring/logger";

export interface CryptoDeps {
  payments: CryptoPayments;
}

export function createCryptoDeps(dataDir: string, accounts: AccountStore, logger: ILogger): CryptoDeps {
  const exchange = createCryptoExchange();
  const payments = new CryptoPayments(exchange, dataDir, {
    logger: {
      info: (msg: string) => logger.info(msg),
      error: (msg: string) => logger.error(msg),
    },
    onPaid: async (invoice) => {
      if (!invoice.tenantId) return;
      await accounts.updateTenantPlan(invoice.tenantId, invoice.plan);
      logger.info(`[crypto] upgrade automático: tenant ${invoice.tenantId} → plano ${invoice.plan} (pago em ${invoice.currency})`);
    },
  });
  return { payments };
}
