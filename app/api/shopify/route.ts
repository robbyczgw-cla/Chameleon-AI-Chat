import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface ShopifyRequest {
  action: "search_products" | "get_product" | "get_inventory" | "list_products"
  query?: string // For search
  productId?: string // For get_product
  limit?: number
  storeUrl?: string // User's store URL
  accessToken?: string // User's access token
}

interface ShopifyProduct {
  id: string
  title: string
  description: string
  handle: string
  vendor: string
  product_type: string
  status: string
  variants: {
    id: string
    title: string
    price: string
    sku: string
    inventory_quantity?: number
    available?: boolean
  }[]
  images: {
    src: string
    alt?: string
  }[]
  tags: string[]
}

// GraphQL query for searching products
const SEARCH_PRODUCTS_QUERY = `
  query searchProducts($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          description
          handle
          vendor
          productType
          status
          tags
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                sku
                inventoryQuantity
                availableForSale
              }
            }
          }
          images(first: 3) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`

// GraphQL query for listing products
const LIST_PRODUCTS_QUERY = `
  query listProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          handle
          vendor
          productType
          status
          tags
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                sku
                inventoryQuantity
                availableForSale
              }
            }
          }
          images(first: 3) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`

// GraphQL query for getting a single product
const GET_PRODUCT_QUERY = `
  query getProduct($id: ID!) {
    product(id: $id) {
      id
      title
      description
      handle
      vendor
      productType
      status
      tags
      variants(first: 50) {
        edges {
          node {
            id
            title
            price
            sku
            inventoryQuantity
            availableForSale
          }
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
          }
        }
      }
    }
  }
`

function transformProduct(node: any): ShopifyProduct {
  return {
    id: node.id,
    title: node.title,
    description: node.description || "",
    handle: node.handle,
    vendor: node.vendor || "",
    product_type: node.productType || "",
    status: node.status,
    tags: node.tags || [],
    variants: (node.variants?.edges || []).map((v: any) => ({
      id: v.node.id,
      title: v.node.title,
      price: v.node.price,
      sku: v.node.sku || "",
      inventory_quantity: v.node.inventoryQuantity,
      available: v.node.availableForSale,
    })),
    images: (node.images?.edges || []).map((img: any) => ({
      src: img.node.url,
      alt: img.node.altText || "",
    })),
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      action,
      query,
      productId,
      limit = 10,
      storeUrl,
      accessToken,
    } = (await req.json()) as ShopifyRequest

    // Get credentials from request or environment
    const store = storeUrl || process.env.SHOPIFY_STORE_URL
    const token = accessToken || process.env.SHOPIFY_ACCESS_TOKEN

    if (!store || !token) {
      return NextResponse.json(
        { error: "Shopify store URL and access token are required" },
        { status: 401 }
      )
    }

    // Clean up store URL
    const cleanStoreUrl = store
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")

    const graphqlEndpoint = `https://${cleanStoreUrl}/admin/api/2024-01/graphql.json`

    let graphqlQuery: string
    let variables: any

    switch (action) {
      case "search_products":
        if (!query) {
          return NextResponse.json(
            { error: "Query is required for search_products" },
            { status: 400 }
          )
        }
        graphqlQuery = SEARCH_PRODUCTS_QUERY
        variables = { query, first: Math.min(limit, 50) }
        break

      case "list_products":
        graphqlQuery = LIST_PRODUCTS_QUERY
        variables = { first: Math.min(limit, 50) }
        break

      case "get_product":
        if (!productId) {
          return NextResponse.json(
            { error: "Product ID is required for get_product" },
            { status: 400 }
          )
        }
        graphqlQuery = GET_PRODUCT_QUERY
        // Ensure the ID is in the correct format
        const formattedId = productId.includes("gid://")
          ? productId
          : `gid://shopify/Product/${productId}`
        variables = { id: formattedId }
        break

      case "get_inventory":
        // For inventory, we'll search products and return inventory data
        graphqlQuery = LIST_PRODUCTS_QUERY
        variables = { first: Math.min(limit, 100) }
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    console.log(`[Shopify API] ${action}:`, variables)

    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Shopify API] Error:", response.status, errorText)
      return NextResponse.json(
        { error: `Shopify API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.errors) {
      console.error("[Shopify API] GraphQL errors:", data.errors)
      return NextResponse.json(
        { error: data.errors[0]?.message || "GraphQL error" },
        { status: 400 }
      )
    }

    // Transform response based on action
    let result: any

    switch (action) {
      case "search_products":
      case "list_products":
        const products = (data.data?.products?.edges || []).map((edge: any) =>
          transformProduct(edge.node)
        )
        result = { products, count: products.length }
        break

      case "get_product":
        if (data.data?.product) {
          result = { product: transformProduct(data.data.product) }
        } else {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 }
          )
        }
        break

      case "get_inventory":
        const inventoryProducts = (data.data?.products?.edges || []).map(
          (edge: any) => {
            const product = transformProduct(edge.node)
            return {
              id: product.id,
              title: product.title,
              variants: product.variants.map((v) => ({
                id: v.id,
                title: v.title,
                sku: v.sku,
                inventory_quantity: v.inventory_quantity,
                available: v.available,
              })),
            }
          }
        )
        result = { inventory: inventoryProducts, count: inventoryProducts.length }
        break
    }

    console.log(`[Shopify API] ${action} completed:`, result?.count || 1, "items")
    return NextResponse.json(result)
  } catch (error) {
    console.error("[Shopify API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
