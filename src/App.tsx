import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AppShell } from '@astryxdesign/core/AppShell'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { NumberInput } from '@astryxdesign/core/NumberInput'
import { Pagination } from '@astryxdesign/core/Pagination'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { TextArea } from '@astryxdesign/core/TextArea'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Theme } from '@astryxdesign/core/theme'
import {
  getStatus,
  initialMovements,
  initialProducts,
  type Category,
  type Movement,
  type MovementType,
  type Product,
  type StockStatus,
} from './data'
import { inventoryTheme } from './theme'
import './App.css'

type Page = 'dashboard' | 'inventory' | 'add-product' | 'movements' | 'alerts'
type Role = 'admin' | 'viewer'
type SortKey = 'updatedAt' | 'stock'

const categories: Category[] = ['식품', '생활용품', '전자기기', '문구']
const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(value)
const formatDate = (value: string, withTime = false) => {
  const date = new Date(value)
  const base = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  return withTime ? `${base} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : base
}
const today = new Date().toISOString().slice(0, 10)

function StatusBadge({ status }: { status: StockStatus }) {
  return <Badge label={status} variant={status === '정상' ? 'success' : status === '부족' ? 'warning' : 'error'} />
}

function App() {
  const [products, setProducts] = useState(initialProducts)
  const [movements, setMovements] = useState(initialMovements)
  const [page, setPage] = useState<Page>('dashboard')
  const [role, setRole] = useState<Role>('admin')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedMovementId, setSelectedMovementId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<'전체' | StockStatus>('전체')
  const [categoryFilter, setCategoryFilter] = useState<'전체' | Category>('전체')
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [listPage, setListPage] = useState(1)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(queryInput)
      // POL-02-02
      setListPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [queryInput])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const counts = useMemo(() => {
    const values = { 전체: products.length, 정상: 0, 부족: 0, 품절: 0 }
    products.forEach((product) => values[getStatus(product)]++)
    return values
  }, [products])

  const lowProducts = useMemo(
    () => products.filter((product) => getStatus(product) !== '정상').sort((a, b) => a.stock - b.stock),
    [products],
  )

  const navigate = (nextPage: Page) => setPage(nextPage)
  const openDetail = (id: number) => {
    setSelectedId(id)
  }
  const closeDetail = () => setSelectedId(null)
  const openMovementDetail = (id: number) => {
    closeDetail()
    setSelectedMovementId(id)
  }
  const showInventory = (status: '전체' | StockStatus = '전체') => {
    setStatusFilter(status)
    setListPage(1)
    navigate('inventory')
  }

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return [...products]
      .filter((product) => !normalized || `${product.name} ${product.code}`.toLowerCase().includes(normalized))
      .filter((product) => categoryFilter === '전체' || product.category === categoryFilter)
      .filter((product) => statusFilter === '전체' || getStatus(product) === statusFilter)
      .sort((a, b) => {
        const delta = sortKey === 'stock'
          ? a.stock - b.stock
          : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        return sortDirection === 'asc' ? delta : -delta
      })
  }, [products, query, categoryFilter, statusFilter, sortKey, sortDirection])

  const selectedProduct = products.find((product) => product.id === selectedId)
  const selectedMovement = movements.find((movement) => movement.id === selectedMovementId)
  const currentTitle: Record<Page, string> = {
    dashboard: '대시보드', inventory: '재고 목록', 'add-product': '상품 등록',
    movements: '입출고 관리', alerts: '재고 부족 알림',
  }

  return (
    <Theme theme={inventoryTheme} mode="light">
      <AppShell
        height="fill"
        variant="section"
        contentPadding={0}
        sideNav={<Sidebar page={page} role={role} alertCount={lowProducts.length} onNavigate={navigate} />}
        topNav={
          <Header
            title={currentTitle[page]}
            role={role}
            onRoleChange={(nextRole) => {
              const value = nextRole as Role
              setRole(value)
              // POL-00-04, POL-00-05
              if (value === 'viewer' && page === 'add-product') setPage('inventory')
            }}
          />
        }
      >
        <div className="content-shell">
          {page === 'dashboard' && (
            <Dashboard
              products={products}
              movements={movements}
              counts={counts}
              lowProducts={lowProducts}
              onStatusClick={showInventory}
              onProductClick={openDetail}
            />
          )}
          {page === 'inventory' && (
            <InventoryList
              products={filteredProducts}
              total={products.length}
              query={queryInput}
              category={categoryFilter}
              status={statusFilter}
              sortKey={sortKey}
              sortDirection={sortDirection}
              page={listPage}
              isAdmin={role === 'admin'}
              onQueryChange={setQueryInput}
              onCategoryChange={(value) => { setCategoryFilter(value); setListPage(1) }}
              onStatusChange={(value) => { setStatusFilter(value); setListPage(1) }}
              onSort={(key) => {
                if (sortKey === key) setSortDirection((value) => value === 'asc' ? 'desc' : 'asc')
                else { setSortKey(key); setSortDirection('desc') }
              }}
              onPageChange={setListPage}
              onReset={() => {
                setQueryInput(''); setQuery(''); setCategoryFilter('전체'); setStatusFilter('전체'); setListPage(1)
              }}
              onProductClick={openDetail}
              onAddProduct={() => navigate('add-product')}
              onMovement={() => navigate('movements')}
            />
          )}
          {page === 'add-product' && role === 'admin' && (
            <ProductForm
              products={products}
              onCancel={() => navigate('inventory')}
              onSave={(product) => {
                setProducts((items) => [...items, product])
                setToast('새 상품이 등록됐어요')
                navigate('inventory')
              }}
            />
          )}
          {page === 'movements' && (
            <MovementPage
              products={products}
              movements={movements}
              isAdmin={role === 'admin'}
              onMovementClick={openMovementDetail}
              onSave={(movement) => {
                setProducts((items) => items.map((product) => product.id === movement.productId
                  ? { ...product, stock: movement.balance, updatedAt: movement.date }
                  : product))
                setMovements((items) => [movement, ...items])
                setToast(`${movement.type} 처리가 완료됐어요`)
              }}
            />
          )}
          {page === 'alerts' && <Alerts products={lowProducts} onProductClick={openDetail} />}
        </div>
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            movements={movements.filter((movement) => movement.productId === selectedId)}
            isAdmin={role === 'admin'}
            onClose={closeDetail}
            onMovementClick={openMovementDetail}
            onMovement={() => {
              closeDetail()
              navigate('movements')
            }}
          />
        )}
        {selectedMovement && (
          <MovementDetailModal
            movement={selectedMovement}
            product={products.find((product) => product.id === selectedMovement.productId)}
            onClose={() => setSelectedMovementId(null)}
          />
        )}
        {toast && <div className="app-toast" role="status">✓ {toast}</div>}
      </AppShell>
    </Theme>
  )
}

function Sidebar({ page, role, alertCount, onNavigate }: {
  page: Page; role: Role; alertCount: number; onNavigate: (page: Page) => void
}) {
  const items: Array<{ id: Page; icon: string; label: string; adminOnly?: boolean; count?: number }> = [
    { id: 'dashboard', icon: '▦', label: '대시보드' },
    { id: 'inventory', icon: '▤', label: '재고 목록' },
    { id: 'movements', icon: '⇄', label: '입출고 관리' },
    { id: 'alerts', icon: '!', label: '재고 부족 알림', count: alertCount },
  ]
  return (
    <aside className="sidebar" aria-label="주요 메뉴">
      <button className="brand" onClick={() => onNavigate('dashboard')}>
        <span className="brand-mark">A</span><span>AstryStock</span>
      </button>
      <div className="nav-label">재고 관리</div>
      <nav className="nav-list">
        {items.filter((item) => !item.adminOnly || role === 'admin').map((item) => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={page === item.id ? 'page' : undefined}
          >
            <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            {item.count ? <span className="nav-count">{item.count}</span> : null}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer"><span className="status-dot" /> 시스템 정상 운영 중</div>
    </aside>
  )
}

function Header({ title, role, onRoleChange }: { title: string; role: Role; onRoleChange: (role: string) => void }) {
  return (
    <header className="topbar">
      <div><div className="breadcrumb">재고 관리 / <strong>{title}</strong></div><h1>{title}</h1></div>
      <div className="header-actions">
        <SegmentedControl value={role} onChange={onRoleChange} label="권한 전환" size="sm">
          <SegmentedControlItem value="admin" label="관리자" />
          <SegmentedControlItem value="viewer" label="조회자" />
        </SegmentedControl>
        <div className="profile"><span className="avatar">김</span><div><strong>김운영</strong><small>{role === 'admin' ? '관리자' : '조회자'}</small></div></div>
      </div>
    </header>
  )
}

function Dashboard({ counts, lowProducts, movements, products, onStatusClick, onProductClick }: {
  counts: Record<'전체' | StockStatus, number>; lowProducts: Product[]; movements: Movement[]; products: Product[]
  onStatusClick: (status: '전체' | StockStatus) => void; onProductClick: (id: number) => void
}) {
  const cards: Array<{ label: '전체' | StockStatus; icon: string; tone: string; note: string }> = [
    { label: '전체', icon: '▦', tone: 'blue', note: '등록 상품' }, { label: '정상', icon: '✓', tone: 'green', note: '안전재고 이상' },
    { label: '부족', icon: '!', tone: 'orange', note: '발주 확인 필요' }, { label: '품절', icon: '×', tone: 'red', note: '즉시 조치 필요' },
  ]
  const recentInbound = movements.filter((item) => item.type === '입고').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  return (
    <div className="page-stack">
      <div className="welcome"><div><h2>안녕하세요, 김운영님</h2><p>오늘의 재고 현황과 필요한 조치를 확인하세요.</p></div><span>{formatDate(today)} 기준</span></div>
      <section><div className="section-heading"><div><span className="section-kicker">Overview</span><h2>재고 현황</h2></div></div>
        <div className="stat-grid">{cards.map((card) => (
          <button className={`stat-card ${card.tone}`} key={card.label} onClick={() => onStatusClick(card.label)}>
            <span className="stat-icon">{card.icon}</span><span className="stat-copy"><small>{card.label} 상품</small><strong>{formatNumber(counts[card.label])}</strong><em>{card.note}</em></span><span className="chevron">›</span>
          </button>
        ))}</div>
      </section>
      <div className="dashboard-grid">
        <section className="panel"><div className="panel-heading"><div><h2>주의가 필요한 상품</h2><p>안전재고 이하 상품을 먼저 보여드려요.</p></div><Button label="전체 보기" variant="ghost" size="sm" onClick={() => onStatusClick('부족')} /></div>
          {lowProducts.length ? <div className="compact-list">{lowProducts.slice(0, 5).map((product) => <button key={product.id} onClick={() => onProductClick(product.id)}><div className="product-cell"><span className="product-thumb">{product.name.slice(0, 1)}</span><div><strong>{product.name}</strong><small>{product.code} · 안전재고 {formatNumber(product.safetyStock)}</small></div></div><div className="stock-right"><strong>{formatNumber(product.stock)}개</strong><StatusBadge status={getStatus(product)} /></div></button>)}</div>
          : <EmptyState title="모든 상품의 재고가 충분해요" isCompact />}
        </section>
        <section className="panel"><div className="panel-heading"><div><h2>최근 입고</h2><p>가장 최근 등록된 입고 내역입니다.</p></div></div>
          {recentInbound.length ? <div className="compact-list inbound">{recentInbound.map((item) => { const product = products.find((p) => p.id === item.productId); return <div key={item.id}><div className="product-cell"><span className="movement-dot">↘</span><div><strong>{product?.name}</strong><small>{item.manager} · {formatDate(item.date)}</small></div></div><strong className="positive">+{formatNumber(item.quantity)}개</strong></div> })}</div>
          : <EmptyState title="최근 입고 내역이 없어요" isCompact />}
        </section>
      </div>
    </div>
  )
}

function InventoryList(props: {
  products: Product[]; total: number; query: string; category: '전체' | Category; status: '전체' | StockStatus;
  sortKey: SortKey; sortDirection: 'asc' | 'desc'; page: number; isAdmin: boolean;
  onQueryChange: (value: string) => void; onCategoryChange: (value: '전체' | Category) => void;
  onStatusChange: (value: '전체' | StockStatus) => void; onSort: (key: SortKey) => void; onPageChange: (page: number) => void;
  onReset: () => void; onProductClick: (id: number) => void; onAddProduct: () => void; onMovement: () => void
}) {
  const pageItems = props.products.slice((props.page - 1) * 10, props.page * 10)
  const hasFilters = props.query || props.category !== '전체' || props.status !== '전체'
  return <div className="page-stack">
    <div className="page-actions"><div><p>등록된 상품 {formatNumber(props.total)}개의 재고를 관리합니다.</p></div><div className="button-row"><Button label="입출고 등록" variant="secondary" onClick={props.onMovement} />{props.isAdmin && <Button label="상품 등록" variant="primary" onClick={props.onAddProduct} />}</div></div>
    <section className="panel table-panel">
      <div className="filter-bar">
        <TextInput label="상품 검색" isLabelHidden type="search" value={props.query} onChange={props.onQueryChange} placeholder="상품명 또는 상품코드 검색" hasClear width={320} />
        <label className="select-field"><span>카테고리</span><select value={props.category} onChange={(event) => props.onCategoryChange(event.target.value as '전체' | Category)}><option>전체</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="select-field"><span>상태</span><select value={props.status} onChange={(event) => props.onStatusChange(event.target.value as '전체' | StockStatus)}><option>전체</option><option>정상</option><option>부족</option><option>품절</option></select></label>
        {hasFilters && <Button label="필터 초기화" variant="ghost" size="sm" onClick={props.onReset} />}
      </div>
      <div className="result-summary"><strong>총 {formatNumber(props.products.length)}건</strong><span>상품 행을 선택하면 상세 정보를 볼 수 있어요.</span></div>
      {pageItems.length ? <><div className="table-wrap"><table><thead><tr><th>상품코드</th><th>상품명</th><th>카테고리</th><th><button onClick={() => props.onSort('stock')}>현재고 {props.sortKey === 'stock' ? (props.sortDirection === 'asc' ? '↑' : '↓') : '↕'}</button></th><th>안전재고</th><th>상태</th><th><button onClick={() => props.onSort('updatedAt')}>최종수정일 {props.sortKey === 'updatedAt' ? (props.sortDirection === 'asc' ? '↑' : '↓') : '↕'}</button></th></tr></thead><tbody>{pageItems.map((product) => <tr key={product.id} onClick={() => props.onProductClick(product.id)} tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && props.onProductClick(product.id)}><td><code>{product.code}</code></td><td><div className="product-cell"><span className="product-thumb small">{product.name.slice(0, 1)}</span><strong className="truncate" title={product.name}>{product.name}</strong></div></td><td>{product.category}</td><td className={getStatus(product) === '품절' ? 'critical-number' : 'number-cell'}>{formatNumber(product.stock)}</td><td className="number-cell">{formatNumber(product.safetyStock)}</td><td><StatusBadge status={getStatus(product)} /></td><td>{formatDate(product.updatedAt)}</td></tr>)}</tbody></table></div><div className="pagination-row"><Pagination page={props.page} onChange={props.onPageChange} totalItems={props.products.length} pageSize={10} size="sm" /></div></>
      : <EmptyState title="조건에 맞는 상품이 없어요" description="검색어나 필터를 바꾸고 다시 확인해 보세요." actions={<Button label="필터 초기화" variant="secondary" onClick={props.onReset} />} />}
    </section>
  </div>
}

function ProductDetailModal({ product, movements, isAdmin, onClose, onMovement, onMovementClick }: { product: Product; movements: Movement[]; isAdmin: boolean; onClose: () => void; onMovement: () => void; onMovementClick: (id: number) => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const status = getStatus(product)
  const ratio = Math.min(100, (product.stock / (product.safetyStock * 2)) * 100)
  return <div className="detail-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
      <header className="detail-modal-header">
        <div><span className="section-kicker">PRODUCT DETAIL</span><div className="title-with-badge"><h2 id="product-detail-title">{product.name}</h2><StatusBadge status={status} /></div><p>{product.code}</p></div>
        <button className="modal-close" type="button" aria-label="상품 상세 닫기" onClick={onClose} autoFocus>×</button>
      </header>
      <div className="detail-modal-body">
        <div className="detail-grid"><Card padding={5}><h3>기본 정보</h3><dl className="meta-grid"><div><dt>상품코드</dt><dd>{product.code}</dd></div><div><dt>카테고리</dt><dd>{product.category}</dd></div><div><dt>현재고</dt><dd>{formatNumber(product.stock)}개</dd></div><div><dt>안전재고</dt><dd>{formatNumber(product.safetyStock)}개</dd></div><div><dt>최종수정일</dt><dd>{formatDate(product.updatedAt)}</dd></div></dl></Card><Card padding={5}><h3>재고 게이지</h3><div className="gauge-number"><strong>{formatNumber(product.stock)}</strong><span>/ 권장 {formatNumber(product.safetyStock * 2)}개</span></div><ProgressBar label="재고 게이지" value={ratio} max={100} variant={status === '정상' ? 'success' : status === '부족' ? 'warning' : 'error'} isLabelHidden /><p className="helper-text">안전재고의 2배를 100% 기준으로 표시합니다.</p></Card></div>
        <section className="panel table-panel"><div className="panel-heading"><div><h2>입출고 이력</h2><p>행을 선택하면 처리 상세를 볼 수 있습니다.</p></div></div>{movements.length ? <div className="table-wrap"><table><thead><tr><th>일시</th><th>구분</th><th>수량</th><th>처리 후 재고</th><th>담당자</th><th>메모</th></tr></thead><tbody>{[...movements].sort((a,b) => b.date.localeCompare(a.date)).map((item) => <tr className="clickable-row" key={item.id} tabIndex={0} onClick={() => onMovementClick(item.id)} onKeyDown={(event) => event.key === 'Enter' && onMovementClick(item.id)}><td>{formatDate(item.date, true)}</td><td><Badge label={item.type} variant={item.type === '입고' ? 'info' : 'neutral'} /></td><td className={item.type === '입고' ? 'positive' : 'negative'}>{item.type === '입고' ? '+' : '−'}{formatNumber(item.quantity)}</td><td>{formatNumber(item.balance)}</td><td>{item.manager}</td><td>{item.memo}</td></tr>)}</tbody></table></div> : <EmptyState title="내역이 없어요" isCompact />}</section>
      </div>
      <footer className="detail-modal-footer"><Button label="닫기" variant="secondary" onClick={onClose} />{isAdmin && <Button label="입출고 등록" variant="primary" onClick={onMovement} />}</footer>
    </section>
  </div>
}

function MovementDetailModal({ movement, product, onClose }: { movement: Movement; product?: Product; onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const beforeStock = movement.type === '입고'
    ? movement.balance - movement.quantity
    : movement.balance + movement.quantity

  return <div className="detail-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="detail-modal movement-detail-modal" role="dialog" aria-modal="true" aria-labelledby="movement-detail-title">
      <header className="detail-modal-header">
        <div><span className="section-kicker">MOVEMENT DETAIL</span><div className="title-with-badge"><h2 id="movement-detail-title">입출고 이력 상세</h2><Badge label={movement.type} variant={movement.type === '입고' ? 'info' : 'neutral'} /></div><p>{formatDate(movement.date, true)} 처리</p></div>
        <button className="modal-close" type="button" aria-label="입출고 이력 상세 닫기" onClick={onClose} autoFocus>×</button>
      </header>
      <div className="detail-modal-body movement-detail-body">
        <div className="movement-product-summary"><span className="product-thumb">{product?.name.slice(0, 1) ?? '?'}</span><div><strong>{product?.name ?? '삭제된 상품'}</strong><small>{product?.code ?? `상품 ID ${movement.productId}`}</small></div></div>
        <dl className="movement-detail-grid">
          <div><dt>처리 구분</dt><dd><Badge label={movement.type} variant={movement.type === '입고' ? 'info' : 'neutral'} /></dd></div>
          <div><dt>처리 수량</dt><dd className={movement.type === '입고' ? 'positive' : 'negative'}>{movement.type === '입고' ? '+' : '−'}{formatNumber(movement.quantity)}개</dd></div>
          <div><dt>처리 전 재고</dt><dd>{formatNumber(beforeStock)}개</dd></div>
          <div><dt>처리 후 재고</dt><dd>{formatNumber(movement.balance)}개</dd></div>
          <div><dt>처리 일시</dt><dd>{formatDate(movement.date, true)}</dd></div>
          <div><dt>담당자</dt><dd>{movement.manager}</dd></div>
          <div className="movement-memo"><dt>메모</dt><dd>{movement.memo || '메모 없음'}</dd></div>
        </dl>
      </div>
      <footer className="detail-modal-footer"><Button label="닫기" variant="secondary" onClick={onClose} /></footer>
    </section>
  </div>
}

function ProductForm({ products, onCancel, onSave }: { products: Product[]; onCancel: () => void; onSave: (product: Product) => void }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('식품')
  const [stock, setStock] = useState<number | null>(null)
  const [safetyStock, setSafetyStock] = useState<number | null>(null)
  const codeExists = products.some((product) => product.code.toLowerCase() === code.trim().toLowerCase())
  const valid = code.trim() && name.trim() && !codeExists && stock !== null && stock >= 0 && safetyStock !== null && safetyStock >= 1
  const submit = (event: FormEvent) => {
    event.preventDefault(); if (!valid) return
    onSave({ id: Math.max(...products.map((item) => item.id)) + 1, code: code.trim().toUpperCase(), name: name.trim(), category, stock: stock!, safetyStock: safetyStock!, updatedAt: new Date().toISOString() })
  }
  return <div className="form-page"><div className="form-intro"><span className="form-icon">＋</span><h2>새 상품 등록</h2><p>기본 정보와 초기 재고를 입력해 상품을 등록하세요.</p></div><form className="form-card" onSubmit={submit}><div className="form-grid"><TextInput label="상품코드" value={code} onChange={setCode} placeholder="예: SKU-0031" isRequired width="100%" status={codeExists ? { type: 'error', message: '이미 사용 중인 상품코드예요' } : undefined} /><TextInput label="상품명" value={name} onChange={setName} placeholder="상품명을 입력하세요" isRequired width="100%" /><label className="select-field full"><span>카테고리 <b>*</b></span><select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><NumberInput label="초기 재고" value={stock} onChange={setStock} hasClear isIntegerOnly min={0} units="개" isRequired width="100%" /><NumberInput label="안전재고" value={safetyStock} onChange={setSafetyStock} hasClear isIntegerOnly min={1} units="개" isRequired width="100%" /></div><div className="form-footer"><Button label="취소" variant="secondary" onClick={onCancel} /><Button label="상품 등록" variant="primary" type="submit" isDisabled={!valid} /></div></form></div>
}

function MovementPage({ products, movements, isAdmin, onSave, onMovementClick }: { products: Product[]; movements: Movement[]; isAdmin: boolean; onSave: (movement: Movement) => void; onMovementClick: (id: number) => void }) {
  const [type, setType] = useState<MovementType>('입고')
  const [productId, setProductId] = useState(products[0]?.id ?? 0)
  const [quantity, setQuantity] = useState<number | null>(null)
  const [date, setDate] = useState(today)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const product = products.find((item) => item.id === productId)
  const quantityError = quantity === null || quantity <= 0 ? '1 이상의 수량을 입력해 주세요' : quantity > 99999 ? '한 번에 99,999개까지 처리할 수 있어요' : type === '출고' && product && quantity > product.stock ? '현재고보다 많이 출고할 수 없어요' : ''
  const nextStock = product && quantity ? product.stock + (type === '입고' ? quantity : -quantity) : product?.stock ?? 0
  const valid = Boolean(product && !quantityError && date && date <= today)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!valid || !product || quantity === null) return
    setSaving(true)
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    onSave({ id: Math.max(0, ...movements.map((item) => item.id)) + 1, productId, type, quantity, balance: nextStock, date: `${date}T12:00:00`, manager: '김운영', memo: memo.trim() || `${type} 등록` })
    setQuantity(null); setMemo(''); setSaving(false)
  }
  return <div className="page-stack"><div className="page-actions"><p>재고의 입고와 출고를 등록하고 최근 이력을 확인합니다.</p></div><div className="movement-layout"><section className="panel movement-form"><div className="panel-heading"><div><h2>재고 이동 등록</h2><p>처리 유형과 수량을 정확히 입력하세요.</p></div></div>{!isAdmin ? <EmptyState title="조회 권한으로 보고 있어요" description="등록 작업은 관리자 권한에서만 가능합니다." isCompact /> : <form onSubmit={submit}><SegmentedControl value={type} onChange={(value) => setType(value as MovementType)} label="입출고 유형" layout="fill"><SegmentedControlItem value="입고" label="입고" /><SegmentedControlItem value="출고" label="출고" /></SegmentedControl><label className="select-field full"><span>상품 <b>*</b></span><select value={productId} onChange={(event) => setProductId(Number(event.target.value))}>{products.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><NumberInput label="수량" value={quantity} onChange={setQuantity} hasClear isIntegerOnly min={1} max={99999} units="개" isRequired width="100%" status={quantity !== null && quantityError ? { type: 'error', message: quantityError } : undefined} /><label className="native-field"><span>처리일 <b>*</b></span><input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} /></label><TextArea label="메모" value={memo} onChange={(value) => setMemo(value.slice(0, 200))} rows={3} maxLength={200} htmlMaxLength={200} isOptional width="100%" />{product && <div className="stock-preview"><div><span>현재고</span><strong>{formatNumber(product.stock)}개</strong></div><span className="preview-arrow">→</span><div><span>처리 후</span><strong>{formatNumber(Math.max(0, nextStock))}개</strong></div><StatusBadge status={getStatus({ stock: Math.max(0, nextStock), safetyStock: product.safetyStock })} /></div>}<Button label="처리 저장" variant="primary" type="submit" width="100%" isDisabled={!valid || saving} isLoading={saving} /></form>}</section><section className="panel table-panel"><div className="panel-heading"><div><h2>최근 입출고 이력</h2><p>행을 선택하면 처리 상세를 볼 수 있습니다.</p></div></div><div className="table-wrap"><table><thead><tr><th>일시</th><th>상품</th><th>구분</th><th>수량</th><th>담당자</th></tr></thead><tbody>{[...movements].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 10).map((item) => <tr className="clickable-row" key={item.id} tabIndex={0} onClick={() => onMovementClick(item.id)} onKeyDown={(event) => event.key === 'Enter' && onMovementClick(item.id)}><td>{formatDate(item.date, true)}</td><td>{products.find((product) => product.id === item.productId)?.name}</td><td><Badge label={item.type} variant={item.type === '입고' ? 'info' : 'neutral'} /></td><td className={item.type === '입고' ? 'positive' : 'negative'}>{item.type === '입고' ? '+' : '−'}{formatNumber(item.quantity)}</td><td>{item.manager}</td></tr>)}</tbody></table></div></section></div></div>
}

function Alerts({ products, onProductClick }: { products: Product[]; onProductClick: (id: number) => void }) {
  const outCount = products.filter((product) => getStatus(product) === '품절').length
  return <div className="page-stack"><div className="alert-hero"><div><span className="alert-icon">!</span><div><h2>{products.length}개 상품에 조치가 필요해요</h2><p>품절 {outCount}개 · 안전재고 이하 {products.length - outCount}개</p></div></div><Badge label="실시간 재고 기준" variant="info" /></div><section className="panel table-panel"><div className="panel-heading"><div><h2>재고 부족 상품</h2><p>품절과 부족 상품을 현재고가 적은 순서로 표시합니다.</p></div></div><div className="table-wrap"><table><thead><tr><th>우선순위</th><th>상품</th><th>카테고리</th><th>현재고</th><th>안전재고</th><th>상태</th></tr></thead><tbody>{products.map((product, index) => <tr key={product.id} onClick={() => onProductClick(product.id)}><td><span className={`priority p${Math.min(index + 1, 3)}`}>{index + 1}</span></td><td><div className="product-cell"><span className="product-thumb small">{product.name.slice(0, 1)}</span><div><strong>{product.name}</strong><small>{product.code}</small></div></div></td><td>{product.category}</td><td className={getStatus(product) === '품절' ? 'critical-number' : 'number-cell'}>{formatNumber(product.stock)}</td><td>{formatNumber(product.safetyStock)}</td><td><StatusBadge status={getStatus(product)} /></td></tr>)}</tbody></table></div></section></div>
}

export default App
