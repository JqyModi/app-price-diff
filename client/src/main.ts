import './style.css';
import { REGION_SPECS } from './region-data';

type ConvertedPrice = {
  amount: number | null;
  currency: string;
  symbol: string;
  rate: number;
  sourceCurrency: string;
  targetRegion: string;
  fetchedAt: string;
};

type PriceInfo = {
  amount: number | null;
  currency: string | null;
  category: string | null;
  converted?: ConvertedPrice | null;
};

type InAppItemPrice = {
  text: string;
  amount: number | null;
  currency: string | null;
  symbol: string | null;
  converted?: ConvertedPrice | null;
};

type InAppItem = {
  name: string;
  priceText: string;
  price: InAppItemPrice | null;
};

type InAppPurchases = {
  available: boolean;
  summary: string | null;
  items: InAppItem[];
};

type WorkerResponse = {
  sourceUrl: string;
  region: string;
  appId: string;
  targetRegion?: string | null;
  extractedAt: string;
  name: string | null;
  price: PriceInfo | null;
  inAppPurchases: InAppPurchases | null;
};

type AppDefinition = {
  id: string;
  name: string;
  appId?: string;
  slug?: string;
  defaultRegion?: string;
  url?: string;
};

type RegionOption = {
  code: string;
  label: string;
  flag: string;
};

type ComparisonRecord = {
  app: AppDefinition;
  region: string;
  payload?: WorkerResponse;
  error?: string;
};

type HistoryEntry = {
  timestamp: number;
  appIds: string[];
  apps: string[];
  regions: string[];
  target: string;
};

const WORKER_BASE_URL =
  (import.meta.env.VITE_WORKER_URL as string | undefined) ??
  'https://app-store-worker.minai012374.workers.dev';

const PRESET_APPS: AppDefinition[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    appId: '6448311069',
    slug: 'chatgpt',
    defaultRegion: 'us',
    url: 'https://apps.apple.com/us/app/chatgpt/id6448311069',
  },
];

const regionNames =
  typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

const REGION_OPTIONS: RegionOption[] = REGION_SPECS.map((entry) => ({
  code: entry.code,
  label: regionDisplayName(entry.code),
  flag: regionCodeToFlag(entry.code),
}))
  .sort((a, b) => a.label.localeCompare(b.label));

const REGION_INDEX = new Map(REGION_OPTIONS.map((item) => [item.code, item]));
const REGION_CURRENCY_INDEX = new Map(REGION_SPECS.map((entry) => [entry.code, entry]));

const filters = {
  app: '',
  region: '',
};

const state: {
  apps: AppDefinition[];
  selectedAppIds: Set<string>;
  selectedRegions: Set<string>;
  targetRegion: string;
  history: HistoryEntry[];
  latestRecords: ComparisonRecord[];
} = {
  apps: [...PRESET_APPS],
  selectedAppIds: new Set(PRESET_APPS.map((app) => app.id)),
  selectedRegions: new Set(['us', 'tr', 'in', 'cn']),
  targetRegion: 'cn',
  history: [],
  latestRecords: [],
};

const template = `
  <div class="page">
    <header class="hero">
      <p class="eyebrow">App Store Price Navigator</p>
      <h1>跨国苹果 App 价格对比</h1>
      <p class="intro">
        选择目标 App 与对比地区，一键查询各国价格并按实时汇率换算，发现最具性价比的下载区域。
      </p>
      <div class="hero-actions">
        <button class="btn primary" id="runButton">立即对比</button>
        <button class="btn ghost" id="clearHistory">清空历史</button>
      </div>
    </header>

    <main class="layout">
      <section class="panel selection-panel" id="selectionPanel">
        <div class="selection-card">
          <div>
            <p class="eyebrow">Apps</p>
            <h2>选择 App</h2>
            <div class="selection-chips" id="appSummaryChips"></div>
          </div>
          <div class="selection-meta">
            <span class="badge" id="appCount"></span>
            <button class="btn ghost" id="openAppDrawer">管理 App</button>
          </div>
        </div>
        <div class="selection-card">
          <div>
            <p class="eyebrow">Regions</p>
            <h2>对比地区</h2>
            <div class="selection-chips" id="regionSummaryChips"></div>
          </div>
          <div class="selection-meta">
            <span class="badge" id="regionCount"></span>
            <button class="btn ghost" id="openRegionDrawer">管理地区</button>
          </div>
          <label class="field target-region">
            <span>目标货币地区</span>
            <select id="targetRegionSelect">
              ${REGION_OPTIONS.map(
                (region) =>
                  `<option value="${region.code}">${region.flag} ${region.label}</option>`,
              ).join('')}
            </select>
          </label>
        </div>
      </section>

      <section class="panel result-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Results</p>
            <h2>价格对比</h2>
          </div>
          <span class="status-badge" id="resultSummary">待查询</span>
        </div>
        <div id="results" class="results"></div>
      </section>

      <section class="panel history-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">History</p>
            <h2>历史记录</h2>
          </div>
        </div>
        <ul id="historyList" class="history-list"></ul>
      </section>
    </main>

    <div class="drawer-overlay" id="appDrawer" aria-hidden="true">
      <aside class="drawer">
        <header class="drawer-head">
          <div>
            <p class="eyebrow">Apps</p>
            <h3>管理 App 选择</h3>
          </div>
          <button class="icon-button" id="closeAppDrawer" aria-label="关闭">&times;</button>
        </header>
        <div class="drawer-controls">
          <input type="search" id="appSearchInput" placeholder="搜索 App 名称或 ID" />
        </div>
        <div class="drawer-grid apps" id="appDrawerList"></div>
        <form id="customAppForm" class="custom-app">
          <h3>添加自定义 App</h3>
          <div class="field-group">
            <label>
              <span>名称</span>
              <input type="text" name="name" placeholder="例如：Notion" required />
            </label>
            <label>
              <span>App ID</span>
              <input type="text" name="appId" placeholder="数字 ID，可选" inputmode="numeric" />
            </label>
          </div>
          <div class="field-group">
            <label>
              <span>默认地区</span>
              <select name="region">
                ${REGION_OPTIONS.map(
                  (region) =>
                    `<option value="${region.code}">${region.flag} ${region.label}</option>`,
                ).join('')}
              </select>
            </label>
            <label>
              <span>App Store 链接</span>
              <input
                type="url"
                name="url"
                placeholder="https://apps.apple.com/..."
              />
            </label>
          </div>
          <p class="hint">至少填写 App ID 或完整链接。</p>
          <div class="custom-app-actions">
            <button class="btn secondary" type="submit">添加 App</button>
            <span class="form-message" id="formMessage"></span>
          </div>
        </form>
      </aside>
    </div>

    <div class="drawer-overlay" id="regionDrawer" aria-hidden="true">
      <aside class="drawer">
        <header class="drawer-head">
          <div>
            <p class="eyebrow">Regions</p>
            <h3>管理对比地区</h3>
          </div>
          <button class="icon-button" id="closeRegionDrawer" aria-label="关闭">&times;</button>
        </header>
        <div class="drawer-controls">
          <input type="search" id="regionSearchInput" placeholder="搜索地区 / 货币 / 代码" />
        </div>
        <div id="regionDrawerGroups" class="region-groups"></div>
        <p class="drawer-hint">提示：可多选多个地区，结果会实时更新。</p>
      </aside>
    </div>
  </div>
`;

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) {
  throw new Error('Missing #app container');
}
root.innerHTML = template;

const elements = {
  appDrawerList: document.querySelector<HTMLDivElement>('#appDrawerList'),
  appDrawer: document.querySelector<HTMLDivElement>('#appDrawer'),
  appCount: document.querySelector<HTMLSpanElement>('#appCount'),
  appSummaryChips: document.querySelector<HTMLDivElement>('#appSummaryChips'),
  openAppDrawerButton: document.querySelector<HTMLButtonElement>('#openAppDrawer'),
  closeAppDrawerButton: document.querySelector<HTMLButtonElement>('#closeAppDrawer'),
  appSearchInput: document.querySelector<HTMLInputElement>('#appSearchInput'),
  regionDrawerGroups: document.querySelector<HTMLDivElement>('#regionDrawerGroups'),
  regionDrawer: document.querySelector<HTMLDivElement>('#regionDrawer'),
  regionCount: document.querySelector<HTMLSpanElement>('#regionCount'),
  regionSummaryChips: document.querySelector<HTMLDivElement>('#regionSummaryChips'),
  openRegionDrawerButton: document.querySelector<HTMLButtonElement>('#openRegionDrawer'),
  closeRegionDrawerButton: document.querySelector<HTMLButtonElement>('#closeRegionDrawer'),
  regionSearchInput: document.querySelector<HTMLInputElement>('#regionSearchInput'),
  targetRegionSelect: document.querySelector<HTMLSelectElement>('#targetRegionSelect'),
  runButton: document.querySelector<HTMLButtonElement>('#runButton'),
  clearHistoryButton: document.querySelector<HTMLButtonElement>('#clearHistory'),
  results: document.querySelector<HTMLDivElement>('#results'),
  summary: document.querySelector<HTMLSpanElement>('#resultSummary'),
  historyList: document.querySelector<HTMLUListElement>('#historyList'),
  customAppForm: document.querySelector<HTMLFormElement>('#customAppForm'),
  formMessage: document.querySelector<HTMLSpanElement>('#formMessage'),
};

if (!elements.appDrawerList || !elements.regionDrawerGroups || !elements.results || !elements.summary) {
  throw new Error('Missing core UI nodes');
}

let activeDrawer: HTMLElement | null = null;

setupDrawer(elements.appDrawer, elements.openAppDrawerButton, elements.closeAppDrawerButton);
setupDrawer(elements.regionDrawer, elements.openRegionDrawerButton, elements.closeRegionDrawerButton);

renderAppList();
renderRegionDrawer();
renderSelectionSummaries();
renderHistory();
setSummary('待查询');
elements.targetRegionSelect!.value = state.targetRegion;

elements.runButton?.addEventListener('click', () => {
  void runComparison();
});

elements.customAppForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  addCustomApp(new FormData(event.currentTarget as HTMLFormElement));
});

elements.targetRegionSelect?.addEventListener('change', (event) => {
  const value = (event.target as HTMLSelectElement).value;
  state.targetRegion = value;
});

elements.clearHistoryButton?.addEventListener('click', () => {
  state.history = [];
  renderHistory();
});

elements.appSearchInput?.addEventListener('input', (event) => {
  filters.app = (event.target as HTMLInputElement).value;
  renderAppList();
});

elements.regionSearchInput?.addEventListener('input', (event) => {
  filters.region = (event.target as HTMLInputElement).value;
  renderRegionDrawer();
});

elements.historyList?.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-history-index]');
  if (!button) return;
  const index = Number(button.dataset.historyIndex);
  if (Number.isNaN(index)) return;
  rerunHistoryEntry(index);
});

function renderAppList() {
  if (!elements.appDrawerList) return;
  if (state.apps.length === 0) {
    elements.appDrawerList.innerHTML = `<p class="drawer-empty">尚未添加 App</p>`;
    return;
  }

  const search = filters.app.trim().toLowerCase();
  const apps = state.apps.filter((app) => {
    if (!search) return true;
    const haystack = [app.name, app.appId ?? '', app.slug ?? ''].join(' ').toLowerCase();
    return haystack.includes(search);
  });

  if (!apps.length) {
    elements.appDrawerList.innerHTML = `<p class="drawer-empty">未找到匹配的 App</p>`;
    return;
  }

  elements.appDrawerList.innerHTML = apps
    .map((app) => {
      const checked = state.selectedAppIds.has(app.id) ? 'checked' : '';
      const regionLabel = app.defaultRegion
        ? REGION_INDEX.get(app.defaultRegion)?.label ?? app.defaultRegion.toUpperCase()
        : '未指定';
      const subtitleParts = [
        app.appId ? `ID ${app.appId}` : '通过链接',
        regionLabel,
      ];
      return `
        <label class="app-card">
          <input type="checkbox" value="${escapeHtml(app.id)}" ${checked} />
          <div class="app-card-body">
            <div>
              <p class="app-name">${escapeHtml(app.name)}</p>
              <p class="app-meta">${subtitleParts.map(escapeHtml).join(' · ')}</p>
            </div>
            <span class="check-indicator"></span>
          </div>
        </label>
      `;
    })
    .join('');

  elements.appDrawerList
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((input) => {
      input.addEventListener('change', (event) => {
        const target = event.currentTarget as HTMLInputElement;
        if (target.checked) {
          state.selectedAppIds.add(target.value);
        } else {
          state.selectedAppIds.delete(target.value);
        }
        renderSelectionSummaries();
      });
    });
}

function renderRegionDrawer() {
  if (!elements.regionDrawerGroups) return;
  const search = filters.region.trim().toLowerCase();
  const matches = REGION_OPTIONS.filter((option) => {
    if (!search) return true;
    const currency = REGION_CURRENCY_INDEX.get(option.code);
    const haystack = [option.label, option.code, currency?.currency ?? '', currency?.symbol ?? '']
      .join(' ')
      .toLowerCase();
    return haystack.includes(search);
  });

  if (!matches.length) {
    elements.regionDrawerGroups.innerHTML = `<p class="drawer-empty">未找到对应的地区</p>`;
    return;
  }

  const grouped = groupBy(matches, (option) => regionGroupKey(option.label));

  elements.regionDrawerGroups.innerHTML = Array.from(grouped.entries())
    .map(([letter, items]) => {
      const options = items
        .map((option) => {
          const active = state.selectedRegions.has(option.code) ? 'active' : '';
          const currency = REGION_CURRENCY_INDEX.get(option.code);
          const metaParts = [option.code.toUpperCase()];
          if (currency) {
            metaParts.push(`${currency.currency} ${currency.symbol}`);
          }
          const metaText = metaParts.join(' · ');
          return `
            <button type="button" class="region-option ${active}" data-code="${option.code}">
              <span class="flag">${option.flag}</span>
              <div>
                <p>${escapeHtml(option.label)}</p>
                <span>${escapeHtml(metaText)}</span>
              </div>
            </button>
          `;
        })
        .join('');
      return `
        <details class="region-group" open>
          <summary>${escapeHtml(letter)}</summary>
          <div class="drawer-grid regions">${options}</div>
        </details>
      `;
    })
    .join('');

  elements.regionDrawerGroups
    .querySelectorAll<HTMLButtonElement>('button[data-code]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const code = button.dataset.code!;
        if (state.selectedRegions.has(code)) {
          state.selectedRegions.delete(code);
          button.classList.remove('active');
        } else {
          state.selectedRegions.add(code);
          button.classList.add('active');
        }
        renderSelectionSummaries();
      });
    });
}

function renderSelectionSummaries() {
  const selectedApps = state.apps.filter((app) => state.selectedAppIds.has(app.id));
  renderPreviewChips(elements.appSummaryChips, selectedApps.map((app) => app.name), '尚未选择 App');

  const regionLabels = Array.from(state.selectedRegions).map((code) =>
    REGION_INDEX.get(code)?.label ?? code.toUpperCase(),
  );
  renderPreviewChips(elements.regionSummaryChips, regionLabels, '尚未选择地区');

  if (elements.appCount) {
    elements.appCount.textContent = `${state.selectedAppIds.size}/${state.apps.length}`;
  }
  if (elements.regionCount) {
    elements.regionCount.textContent = `${state.selectedRegions.size}/${REGION_OPTIONS.length}`;
  }
}

function renderPreviewChips(
  container: HTMLDivElement | null,
  values: string[],
  emptyText: string,
) {
  if (!container) return;
  if (!values.length) {
    container.innerHTML = `<p class="empty">${escapeHtml(emptyText)}</p>`;
    return;
  }
  const preview = values
    .slice(0, 3)
    .map((value) => `<span class="mini-chip">${escapeHtml(value)}</span>`)
    .join('');
  const remaining = values.length - 3;
  container.innerHTML =
    remaining > 0 ? `${preview}<span class="mini-chip muted">+${remaining}</span>` : preview;
}

function setupDrawer(
  overlay: HTMLDivElement | null,
  openButton: HTMLButtonElement | null,
  closeButton: HTMLButtonElement | null,
) {
  if (!overlay) return;
  overlay.setAttribute('aria-hidden', 'true');
  openButton?.addEventListener('click', () => openDrawer(overlay));
  closeButton?.addEventListener('click', () => closeDrawer(overlay));
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeDrawer(overlay);
    }
  });
}

function openDrawer(overlay: HTMLElement) {
  if (activeDrawer && activeDrawer !== overlay) {
    closeDrawer(activeDrawer);
  }
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-drawer-open');
  activeDrawer = overlay;
}

function closeDrawer(overlay: HTMLElement) {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  if (activeDrawer === overlay) {
    activeDrawer = null;
    document.body.classList.remove('has-drawer-open');
  }
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activeDrawer) {
    closeDrawer(activeDrawer);
  }
});

async function runComparison() {
  if (!state.selectedAppIds.size) {
    setSummary('请至少选择一个 App');
    return;
  }
  if (!state.selectedRegions.size) {
    setSummary('请至少选择一个对比地区');
    return;
  }

  const selectedApps = state.apps.filter((app) => state.selectedAppIds.has(app.id));
  const regions = Array.from(state.selectedRegions);
  const totalJobs = selectedApps.length * regions.length;
  let completed = 0;

  setSummary('查询中…');
  elements.results!.innerHTML = `<div class="placeholder">正在获取价格数据…</div>`;

  const records: ComparisonRecord[] = [];
  for (const app of selectedApps) {
    for (const region of regions) {
      // eslint-disable-next-line no-await-in-loop
      const record = await fetchComparisonRecord(app, region, state.targetRegion).finally(() => {
        completed += 1;
        setSummary(`查询中 ${completed}/${totalJobs}`);
      });
      records.push(record);
    }
  }

  state.latestRecords = records;
  setSummary(`已完成 · ${records.filter((r) => r.payload).length} 成功`);
  renderResults(records);
  pushHistory(selectedApps, regions, state.targetRegion);
}

async function fetchComparisonRecord(
  app: AppDefinition,
  region: string,
  targetRegion: string,
): Promise<ComparisonRecord> {
  try {
    const response = await fetch(buildWorkerUrl(app, region, targetRegion), {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      const message = response.status === 404 ? '该地区未上架该 App' : `Worker error ${response.status}`;
      throw new Error(message);
    }
    const payload = (await response.json()) as WorkerResponse;
    return { app, region, payload };
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return { app, region, error: message };
  }
}

function buildWorkerUrl(app: AppDefinition, region: string, targetRegion: string) {
  const params = new URLSearchParams();

  if (app.appId) {
    params.set('appId', app.appId);
    params.set('region', region);
    params.set('name', slugify(app.slug ?? app.name));
  } else if (app.url) {
    params.set('url', app.url);
  } else {
    throw new Error(`App "${app.name}" 缺少 appId/url`);
  }

  params.set('toregion', targetRegion);
  return `${WORKER_BASE_URL}/?${params.toString()}`;
}

function renderResults(records: ComparisonRecord[]) {
  if (!elements.results) return;
  if (!records.length) {
    elements.results.innerHTML = `<div class="placeholder">尚未开始查询</div>`;
    return;
  }

  const grouped = groupBy(records.filter((record) => state.selectedAppIds.has(record.app.id)), (record) =>
    record.app.id,
  );

  const sections = Array.from(grouped.entries()).map(([appId, rows]) =>
    renderResultSection(appId, rows),
  );

  elements.results.innerHTML = sections.join('');
}

function renderResultSection(appId: string, rows: ComparisonRecord[]) {
  const app = rows[0]?.app;
  if (!app) return '';

  const successes = rows.filter((row) => row.payload);
  const allIapAmounts = successes
    .flatMap((row) => row.payload?.inAppPurchases?.items ?? [])
    .map((item) => item.price?.converted?.amount)
    .filter((value): value is number => typeof value === 'number');
  const globalBestIapAmount = allIapAmounts.length ? Math.min(...allIapAmounts) : null;

  const tableRows = successes
    .map((row) => {
      const regionInfo =
        REGION_INDEX.get(row.region) ?? ({ code: row.region, label: row.region, flag: '🌐' } as RegionOption);
      const payload = row.payload!;
      const iapLabel = formatIapSummary(payload.inAppPurchases, globalBestIapAmount);

      return `
        <tr>
          <td>
            <div class="cell-region">
              <span class="flag">${regionInfo.flag}</span>
              <div>
                <p>${escapeHtml(regionInfo.label)}</p>
                <span>${row.region.toUpperCase()}</span>
              </div>
            </div>
          </td>
          <td>${iapLabel}</td>
        </tr>
      `;
    })
    .join('');

  const errors = rows.filter((row) => row.error).map(
    (row) => `
      <li>
        ${escapeHtml(row.app.name)} · ${row.region.toUpperCase()} - ${escapeHtml(row.error!)}
      </li>
    `,
  );

  return `
    <section class="result-group" id="app-${escapeHtml(appId)}">
      <header>
        <div>
          <p class="eyebrow">查询结果</p>
          <h3>${escapeHtml(app.name)}</h3>
        </div>
        <a class="link" href="${escapeHtml(app.url ?? '#')}" target="_blank" rel="noreferrer">
          查看 App Store
        </a>
      </header>
      ${
        tableRows
          ? `
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>地区</th>
                    <th>内购概览</th>
                  </tr>
                </thead>
                <tbody>${tableRows}</tbody>
              </table>
            </div>
          `
          : `<div class="placeholder">暂无数据</div>`
      }
      ${
        errors.length
          ? `<ul class="error-list">${errors.join('')}</ul>`
          : ''
      }
    </section>
  `;
}

function formatIapSummary(iap: InAppPurchases | null | undefined, bestAmount: number | null) {
  if (!iap || !iap.items.length) {
    return `<div class="iap-chip-group"><span class="iap-chip muted">未获取内购数据</span></div>`;
  }

  const MAX_ITEMS = 3;
  const bestPredicate = (item: InAppItem) => {
    const amount = item.price?.converted?.amount;
    return typeof bestAmount === 'number' && typeof amount === 'number' && Math.abs(amount - bestAmount) < 0.001;
  };

  let displayItems = iap.items.slice(0, MAX_ITEMS);
  const bestIndex = iap.items.findIndex(bestPredicate);
  if (bestIndex >= MAX_ITEMS && bestIndex !== -1) {
    displayItems = [...iap.items.slice(0, MAX_ITEMS - 1), iap.items[bestIndex]];
  }

  const chips = displayItems
    .map((item) => {
      const converted = item.price?.converted ?? null;
      const convertedAmount =
        converted && typeof converted.amount === 'number'
          ? formatCurrency(converted.amount, converted.currency, converted.symbol)
          : null;
      const originalFormatted = item.price
        ? formatCurrency(item.price.amount ?? null, item.price.currency ?? undefined, item.price.symbol ?? undefined)
        : item.priceText ?? '—';
      const originalLabel =
        originalFormatted === '—' && item.priceText ? item.priceText : originalFormatted ?? '—';
      const convertedLabel = convertedAmount ?? '—';
      const convertedText = convertedLabel !== '—' ? escapeHtml(convertedLabel) : null;
      const originalText = originalLabel !== '—' ? escapeHtml(originalLabel) : null;
      const meta = [convertedText, originalText].filter(Boolean).join(' / ');
      const isBest = bestPredicate(item);
      const compactClass = meta ? '' : ' compact';
      return `
        <span class="iap-chip${isBest ? ' best' : ''}${compactClass}">
          <span class="iap-chip-name">${escapeHtml(item.name)}</span>
          ${meta ? `<span class="iap-chip-meta">${meta}</span>` : ''}
        </span>
      `;
    })
    .join('');

  const extraCount = iap.items.length - displayItems.length;
  const extraChip = extraCount > 0 ? `<span class="iap-chip muted compact">+${extraCount} 项</span>` : '';

  return `<div class="iap-chip-group">${chips}${extraChip}</div>`;
}

function formatCurrency(amount: number | null, currency?: string | null, fallbackSymbol?: string | null) {
  if (amount === null || amount === undefined) return '—';
  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // ignore
    }
  }
  const symbol = fallbackSymbol ?? '';
  return `${symbol}${amount.toFixed(2)}`;
}

function addCustomApp(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const appId = String(formData.get('appId') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim();
  const region = String(formData.get('region') ?? '').trim() || 'us';

  if (!name || (!appId && !url)) {
    setFormMessage('请填写名称，并提供 App ID 或链接');
    return;
  }

  const newApp: AppDefinition = {
    id: `custom-${Date.now()}`,
    name,
    appId: appId || undefined,
    url: url || undefined,
    defaultRegion: region,
    slug: slugify(name),
  };

  state.apps.push(newApp);
  state.selectedAppIds.add(newApp.id);
  renderAppList();
  renderSelectionSummaries();
  setFormMessage('已添加，默认选中');
  elements.customAppForm?.reset();
}

function setFormMessage(message: string) {
  if (elements.formMessage) {
    elements.formMessage.textContent = message;
  }
}

function setSummary(message: string) {
  if (elements.summary) {
    elements.summary.textContent = message;
  }
}

function pushHistory(apps: AppDefinition[], regions: string[], target: string) {
  const appIds = apps.map((app) => app.id);
  const appNames = apps.map((app) => app.name);
  state.history.unshift({
    timestamp: Date.now(),
    appIds,
    apps: appNames,
    regions,
    target,
  });
  state.history = state.history.slice(0, 8);
  renderHistory();
}

function rerunHistoryEntry(index: number) {
  const entry = state.history[index];
  if (!entry) return;

  const availableAppIds = new Set(state.apps.map((app) => app.id));
  let nextAppIds = entry.appIds.filter((id) => availableAppIds.has(id));
  if (!nextAppIds.length) {
    nextAppIds = state.apps.filter((app) => entry.apps.includes(app.name)).map((app) => app.id);
  }
  if (!nextAppIds.length) {
    setSummary('历史记录中的 App 已不可用');
    return;
  }

  const normalizedRegions = entry.regions
    .map((region) => region.toLowerCase())
    .filter((code) => REGION_INDEX.has(code));
  if (!normalizedRegions.length) {
    setSummary('历史记录中的地区已不可用');
    return;
  }

  state.selectedAppIds = new Set(nextAppIds);
  state.selectedRegions = new Set(normalizedRegions);

  const normalizedTarget = entry.target.toLowerCase();
  if (REGION_INDEX.has(normalizedTarget)) {
    state.targetRegion = normalizedTarget;
    if (elements.targetRegionSelect) {
      elements.targetRegionSelect.value = normalizedTarget;
    }
  }

  renderAppList();
  renderRegionDrawer();
  renderSelectionSummaries();
  setSummary('正在根据历史记录重新查询…');
  void runComparison();
}

function renderHistory() {
  if (!elements.historyList) return;
  if (!state.history.length) {
    elements.historyList.innerHTML = `<li class="empty">暂无记录</li>`;
    return;
  }
  elements.historyList.innerHTML = state.history
    .map((entry, index) => {
      const time = new Date(entry.timestamp).toLocaleString();
      const apps = entry.apps.join(', ');
      const regionBadges = entry.regions
        .map((code) => `<span class="mini-chip">${code.toUpperCase()}</span>`)
        .join('');
      return `
        <li>
          <div>
            <p class="history-time">${escapeHtml(time)}</p>
            <p class="history-apps">${escapeHtml(apps)}</p>
          </div>
          <div class="history-meta">
            <span class="mini-chip target">目标 ${entry.target.toUpperCase()}</span>
            ${regionBadges}
            <button class="btn ghost history-rerun" data-history-index="${index}">
              重新查询
            </button>
          </div>
        </li>
      `;
    })
    .join('');
}

function regionGroupKey(label: string) {
  if (!label) return '#';
  const letter = label.charAt(0).toUpperCase();
  if (letter >= 'A' && letter <= 'Z') {
    return letter;
  }
  return '#';
}

function groupBy<T>(items: T[], keyGetter: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyGetter(item);
    const existing = map.get(key);
    if (existing) {
      existing.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function regionCodeToFlag(code: string) {
  if (!code || code.length < 2) return '🌐';
  const [first, second] = code.toUpperCase().slice(0, 2).split('');
  const base = 0x1f1e6;
  const charCode = (char: string) => base + char.charCodeAt(0) - 65;
  if (first < 'A' || first > 'Z' || second < 'A' || second > 'Z') {
    return '🌐';
  }
  return String.fromCodePoint(charCode(first), charCode(second));
}

function regionDisplayName(code: string) {
  return regionNames?.of(code.toUpperCase()) ?? code.toUpperCase();
}
