'use client';

import { useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from 'next/link';
import { debounce } from 'lodash';
import useEmblaCarousel from 'embla-carousel-react';
import Loading from '@/components/loading';
import HeaderMobile from '@/components/HeaderMobile/page';
import { CiSearch, CiCircleRemove } from 'react-icons/ci';
import { HiMiniSquares2X2 } from "react-icons/hi2";
import { getShopStatus } from "@/lib/shopHours";

interface ShopHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface Shop {
  id: string;
  name: string;
  logoUrl?: string;
  imageUrl: string;
  description?: string;
  zone?: string;
  location?: string;
  categoryId?: string;
  branchId?: string;
  isVisible?: boolean;
  hours?: ShopHour[];

  category?: {
    id: string;
    name: string;
    imageUrl?: string;
    color?: string;
  };

  branch?: {
    id: string;
    name: string;
  };
}

interface Branch {
  id: string;
  name: string;
  imageUrl: string;
}

interface Category {
  id: string;
  name: string;
  imageUrl: string;
  _count: { shops: number };
}

const DIR_FILTERS_STORAGE_KEY = 'thepaseo.directory.filters.v1';

/** เปรียบเทียบ query แบบลำดับ key คงที่ — กันลูป router.replace ↔ searchParams */
function stableQueryFromFilters(f: {
  branchId: string;
  categoryId: string;
  search: string;
}) {
  const p = new URLSearchParams();
  if (f.branchId) p.set("branchId", f.branchId);
  if (f.categoryId) p.set("categoryId", f.categoryId);
  if (f.search) p.set("search", f.search);
  return [...p.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

function stableQueryFromSearchParams(sp: URLSearchParams) {
  const keys = ['branchId', 'categoryId', 'search'] as const;
  const p = new URLSearchParams();
  for (const k of keys) {
    const v = sp.get(k);
    if (v) p.set(k, v);
  }
  return [...p.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

export default function DirectoryPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [filters, setFilters] = useState({
    branchId: '',
    categoryId: '',
    search: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [emblaRef, emblaApi] = useEmblaCarousel({ dragFree: true });
  const [filterLoading, setFilterLoading] = useState(false);

  // Hydrate จาก URL ก่อน แล้วเติมช่องว่างจาก sessionStorage (กรณีย้อนกลับ / searchParams ว่างชั่วคราว / bfcache)
  useLayoutEffect(() => {
    const urlBranch = searchParams.get('branchId') || '';
    const urlCat = searchParams.get('categoryId') || '';
    const urlSearch = searchParams.get('search') || '';

    let stored = { branchId: '', categoryId: '', search: '' };
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(DIR_FILTERS_STORAGE_KEY);
        if (raw) {
          const p = JSON.parse(raw) as Record<string, unknown>;
          stored = {
            branchId: typeof p.branchId === 'string' ? p.branchId : '',
            categoryId: typeof p.categoryId === 'string' ? p.categoryId : '',
            search: typeof p.search === 'string' ? p.search : '',
          };
        }
      } catch {
        /* ignore */
      }
    }

    const next = {
      branchId: urlBranch || stored.branchId,
      categoryId: urlCat || stored.categoryId,
      search: urlSearch || stored.search,
    };

    setFilters((prev) => {
      if (
        prev.branchId === next.branchId &&
        prev.categoryId === next.categoryId &&
        prev.search === next.search
      ) {
        return prev;
      }
      return next;
    });
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!filters.branchId && !filters.categoryId && !filters.search) return;
    try {
      sessionStorage.setItem(DIR_FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      /* ignore */
    }
  }, [filters]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      const sp = new URLSearchParams(window.location.search);
      const urlBranch = sp.get('branchId') || '';
      const urlCat = sp.get('categoryId') || '';
      const urlSearch = sp.get('search') || '';
      let stored = { branchId: '', categoryId: '', search: '' };
      try {
        const raw = sessionStorage.getItem(DIR_FILTERS_STORAGE_KEY);
        if (raw) {
          const p = JSON.parse(raw) as Record<string, unknown>;
          stored = {
            branchId: typeof p.branchId === 'string' ? p.branchId : '',
            categoryId: typeof p.categoryId === 'string' ? p.categoryId : '',
            search: typeof p.search === 'string' ? p.search : '',
          };
        }
      } catch {
        /* ignore */
      }
      const next = {
        branchId: urlBranch || stored.branchId,
        categoryId: urlCat || stored.categoryId,
        search: urlSearch || stored.search,
      };
      setFilters((prev) => {
        if (
          prev.branchId === next.branchId &&
          prev.categoryId === next.categoryId &&
          prev.search === next.search
        ) {
          return prev;
        }
        return next;
      });
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/profile`);
        if (res.ok) {
          const data = await res.json();
          if (data?.user && typeof data.user === "object") {
            setUser(data.user);
            try {
              localStorage.setItem("user", JSON.stringify(data.user));
            } catch {
              /* ignore */
            }
          }
        } else if (res.status === 401) {
          router.push('/auth/login');
        }
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

    useEffect(() => {
      const fetchBranches = async () => {
        const res = await fetchWithAuth(`${API_URL}/shop/branch`);
        const data = await res.json();

        const filteredBranches = data.filter(
          (branch: Branch) => branch.name !== "บางนา"
        );

        setBranches(filteredBranches);
      };

      fetchBranches();
    }, []);

  useEffect(() => {
    if (!filters.branchId) return;

    const fetchCategories = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/shop/category?branchId=${filters.branchId}`);
        const data = await res.json();

        const filteredCategories = data.filter(
          (category: Category) => (category._count?.shops ?? 0) > 0
        );

        setCategories(filteredCategories);
      } catch (err) {
        setError('Failed to load categories');
      }
    };

    fetchCategories();
  }, [filters.branchId]);

  // สาขาเริ่มต้นเฉพาะเมื่อยังไม่มีสาขาใน state (hydrate + session จัดการแล้ว)
  useEffect(() => {
    if (branches.length === 0) return;
    setFilters((prev) => {
      if (prev.branchId) return prev;
      return { ...prev, branchId: branches[0].id };
    });
  }, [branches]);

  // Debounced fetch shops
const fetchShops = async (currentFilters = filters) => {
  let loadingTimer: any;

  try {
    loadingTimer = setTimeout(() => {
      setFilterLoading(true);
    }, 150);

    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(currentFilters).filter(([_, v]) => v)
      )
    );

    const res = await fetchWithAuth(`${API_URL}/shop?${params.toString()}`);
    const data = await res.json();

    setShops(Array.isArray(data) ? data : []);
  } finally {
    clearTimeout(loadingTimer);
    setFilterLoading(false);
  }
};

const debouncedFetchShops = useMemo(() => {
  return debounce((nextFilters) => {
    fetchShops(nextFilters);
  }, 300);
}, []);


useEffect(() => {
  debouncedFetchShops(filters);
  return () => {
    debouncedFetchShops.cancel();
  };
}, [filters]);

useEffect(() => {
  const nextQ = stableQueryFromFilters(filters);
  const currentQ = stableQueryFromSearchParams(searchParams);
  if (nextQ === currentQ) return;

  const nextUrl = nextQ ? `${pathname}?${nextQ}` : pathname;
  router.replace(nextUrl, { scroll: false });
}, [filters, pathname, router, searchParams]);

  // Log Embla API slides
  useEffect(() => {
  }, [emblaApi]);

  // New function to clear search
  const handleClearSearch = () => {
    setFilters({ ...filters, search: '' });
  };

  if (loading) {
    return <Loading />;
  }

  const visibleShops = shops.filter((shop) => shop.isVisible !== false);
  const showHoursLegend = visibleShops.some(
    (shop) => getShopStatus(shop.hours ?? []) !== null
  );

  return (
    <div className="max-w-2xl mx-auto p-0 mb-20 md:mt-10 md:mb-4 mb-4 rounded-xl">
      <HeaderMobile />
    
      <div className="md:mt-16 mt-0 mb-0 md:pt-4 pt-16">
        <div className="relative max-w-2xl mx-auto md:pt-10 pt-8 md:mt-0 mt-0 bg-white rounded-3xl shadow-md flex flex-col gap-4">
          <div className="px-4 pt-0 md:px-10 md:pt-0">
            <div className="flex flex-row gap-2 px-4">
              <span className="text-base font-bold">ร้านค้า</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 px-4">
            {/* Section 1: Search */}
            <div className="px-4 pt-0 md:px-10 md:pt-0 mb-2">
              <div className="relative ">
                <input
                  type="text"
                  placeholder="ค้นหาร้านค้า..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="bg-gray-50 p-2 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-paseo pl-10 pr-10"
                />
                <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                {filters.search && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="ล้างการค้นหา"
                  >
                    <CiCircleRemove size={24} />
                  </button>
                )}
              </div>

            </div>
            

            {/* Section 2: Branches */}
            <div className="flex flex-col px-4 pt-0 md:px-4 md:pt-0 gap-3">
              <span className="text-base font-bold">สาขา</span>

              <div className="flex justify-center md:gap-10 gap-2 overflow-x-auto pb-2">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        branchId: branch.id,
                        categoryId: "",
                      })
                    }
                    className="flex flex-col items-center gap-2 transition min-w-[90px]"
                  >
                    {/* LOGO */}
                    <div
                      className={`w-20 h-20 p-2 aspect-square rounded-xl overflow-hidden flex items-center justify-center border transition
                      ${
                        filters.branchId === branch.id
                          ? "bg-gray-50 border-paseo-dark"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Image
                        src={
                          branch.imageUrl?.startsWith("/")
                            ? branch.imageUrl
                            : branch.imageUrl?.startsWith("http")
                            ? branch.imageUrl
                            : "/images/no-image.png"
                        }
                        alt={branch.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                        unoptimized
                        priority
                      />
                    </div>

                    {/* NAME */}
                    <span className="text-xs font-semibold text-center leading-tight">
                      {branch.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Categories */}
            <div className="flex flex-col px-4 pt-0 md:px-4 md:pt-0 gap-3">
              <span className="text-base font-bold">หมวดหมู่</span>

              {categories.length === 0 ? (
                <p className="text-gray-500">ไม่มีหมวดหมู่ที่มีร้านค้า</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-4 md:grid-cols-8 auto-cols-[90px] md:gap-2 gap-2 pb-2 scrollbar-hidden">

                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() =>
                          setFilters({ ...filters, categoryId: category.id })
                        }
                        className="flex flex-col items-center gap-2 transition w-[80px]"
                      >

                        <div
                          className={`md:w-14 md:h-14 w-16 h-16 p-2 rounded-xl overflow-hidden flex items-center justify-center border ${
                            filters.categoryId === category.id
                              ? "bg-gray-50 border-paseo-dark"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <Image
                            src={category.imageUrl || "/images/no-image.png"}
                            alt={category.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-contain"
                            unoptimized
                            priority
                          />
                        </div>

                        <span className="text-xs font-medium text-center leading-tight line-clamp-1 break-words w-16 min-h-[2rem]">
                          {category.name}
                        </span>

                      </button>
                    ))}

                    {/* ALL */}
                    <button
                      onClick={() => setFilters({ ...filters, categoryId: "" })}
                      className="flex flex-col items-center gap-2 transition min-w-[80px]"
                    >
                      <div
                        className={`md:w-14 md:h-14 w-16 h-16 p-2 rounded-xl flex items-center justify-center border transition ${
                          filters.categoryId === ""
                            ? "bg-gray-50 border-paseo-dark"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <Image
                          src="/icon/icon-all.png"
                          alt="all"
                          width={40}
                          height={40}
                          className="w-full h-full object-contain"
                          unoptimized
                          priority
                          blurDataURL="/blur-placeholder.jpg"
                        />
                      </div>

                      <span className="text-xs font-medium text-center leading-tight line-clamp-1 break-words w-16 min-h-[2rem]">
                        ทั้งหมด
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-8 md:p-4 bg-gray-100 rounded-3xl">
            {/* Error Message */}
            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Loading Indicator for Search */}
            {filterLoading && (
              <p className="text-gray-500 text-center mb-4">กำลังค้นหา...</p>
            )}

            {/* Shop Grid */}
            {shops.length === 0 ? (
              <p className="text-gray-500">ไม่พบร้านค้า</p>
            ) : (
              <>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 md:gap-4 gap-6">
                {visibleShops.map((shop) => {
                  const status = getShopStatus(shop.hours ?? []);

                  return (
                  <Link
                    key={shop.id}
                    href={`/shop/${shop.id}?from=directory&${new URLSearchParams(
                      Object.entries(filters).filter(([_, v]) => Boolean(v)) as [string, string][]
                    ).toString()}`}
                    className="overflow-hidden transition relative bg-white p-2 rounded-xl shadow-sm"
                  >
                    {status && (
                      <span
                        className={`absolute top-2 right-2 z-10 h-3 w-3 rounded-full ring-2 ring-white ${
                          status.open ? "bg-paseo" : "bg-gray-200"
                        }`}
                        title={status.open ? "เปิดอยู่" : "ปิดอยู่"}
                        aria-label={status.open ? "ร้านเปิดอยู่" : "ร้านปิดอยู่"}
                      />
                    )}

                    <div className="relative flex justify-center h-24">
                      {shop.logoUrl ? (
                        <Image
                          src={
                            shop.logoUrl.startsWith('/')
                              ? shop.logoUrl
                              : shop.logoUrl.startsWith('http')
                              ? shop.logoUrl
                              : '/images/no-image.png'
                          }
                          alt={shop.name}
                          width={60}
                          height={60}
                          className="object-contain w-22 h-22 rounded-lg"
                          unoptimized
                          priority
                          placeholder="blur"
                          blurDataURL="/blur-placeholder.jpg"
                        />
                      ) : (
                        <div className="w-22 h-22 bg-paseo-hover flex items-center justify-center rounded-lg p-2">
                          <span className="text-gray-500 text-xs">Image</span>
                        </div>
                      )}

                    </div>
                    <div className="flex flex-col gap-0 items-start">
                      <p
                        className="text-xs font-semibold text-white px-2 py-0 rounded-lg"
                        style={{
                          backgroundColor: shop.category?.color || "#9dc93c"
                        }}
                      >
                        {shop.category?.name || "-"}
                      </p>
                      <h2 className="md:text-xs text-sm font-semibold mt-1 mb-0">{shop.name}</h2>
                      <p className="text-xs text-gray-600">{shop.branch?.name || '-'}</p>
                    </div>
                  </Link>
                  );
                })}
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}