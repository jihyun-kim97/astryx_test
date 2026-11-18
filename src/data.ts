export type StockStatus = '정상' | '부족' | '품절'
export type Category = '식품' | '생활용품' | '전자기기' | '문구'
export type MovementType = '입고' | '출고'

export interface Product {
  id: number
  code: string
  name: string
  category: Category
  stock: number
  safetyStock: number
  updatedAt: string
}

export interface Movement {
  id: number
  productId: number
  type: MovementType
  quantity: number
  balance: number
  date: string
  manager: string
  memo: string
}

const names = [
  '제주 유기농 감귤 주스', '콜드브루 원액 500ml', '통밀 크래커', '견과 에너지바',
  '천연 미네랄 워터', '프리미엄 녹차 티백', '친환경 주방 세제', '대나무 칫솔 세트',
  '고농축 섬유유연제', '극세사 청소포', '리필형 손 세정제', '다목적 클리너',
  '무선 블루투스 키보드', 'USB-C 멀티 허브', '노이즈 캔슬링 이어폰', '휴대용 보조배터리',
  '스마트 LED 스탠드', '무선 마우스', 'A5 하드커버 노트', '저점도 볼펜 12색',
  '데스크 오거나이저', '재생지 메모 패드', '컬러 인덱스 탭', '파일 바인더 세트',
  '드립백 커피 세트', '유기농 그래놀라', '욕실 청소 브러시', 'HD 웹캠',
  '기계식 연필 세트', '라벨 스티커 롤',
] as const

const categories: Category[] = ['식품', '생활용품', '전자기기', '문구']
const normalStocks = [84, 122, 76, 61, 140, 92, 54, 68, 73, 48, 95, 64, 37, 52, 31, 46, 59, 43]
const lowStocks = [8, 12, 6, 9, 5, 11, 7, 4]

export const initialProducts: Product[] = names.map((name, index) => {
  const stock = index < 18 ? normalStocks[index] : index < 26 ? lowStocks[index - 18] : 0
  const safetyStock = index < 18 ? 20 : index < 26 ? 12 : 10
  return {
    id: index + 1,
    code: `SKU-${String(index + 1).padStart(4, '0')}`,
    name,
    category: categories[Math.floor(index / 6) % categories.length],
    stock,
    safetyStock,
    updatedAt: `2026-${String(11 - (index % 3)).padStart(2, '0')}-${String(16 - (index % 12)).padStart(2, '0')}T${String(9 + (index % 8)).padStart(2, '0')}:20:00`,
  }
})

const managers = ['김운영', '이재고', '박물류', '최관리']

export const initialMovements: Movement[] = initialProducts.flatMap((product, index) => {
  const base = product.stock + 16
  return [0, 1, 2].map((offset) => {
    const inbound = offset !== 1
    const quantity = inbound ? 20 + ((index + offset) % 12) : 8 + (index % 7)
    return {
      id: index * 3 + offset + 1,
      productId: product.id,
      type: inbound ? '입고' : '출고',
      quantity,
      balance: Math.max(0, base - offset * 6),
      date: `2026-11-${String(16 - ((index + offset) % 14)).padStart(2, '0')}T${String(9 + (index % 8)).padStart(2, '0')}:30:00`,
      manager: managers[(index + offset) % managers.length],
      memo: inbound ? '정기 발주 입고' : '운영 출고',
    } satisfies Movement
  })
})

// POL-00-01, POL-00-02, POL-00-03
export function getStatus(product: Pick<Product, 'stock' | 'safetyStock'>): StockStatus {
  if (product.stock === 0) return '품절'
  if (product.stock <= product.safetyStock) return '부족'
  return '정상'
}
