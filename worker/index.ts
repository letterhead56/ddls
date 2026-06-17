export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    type Data = {
      fileName: string;
      mimeType: string;
      size: string;
      date: string;
      url: string;
    };
    type StandardResponse = {
      data: Data[];
      meta: {
        pagination: {
          currentPage: number;
          pageSize: number;
          totalItems: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
        queryStats: {
          processingTimeMs: number;
        };
      };
    };

    // HUBCLOUD
    if (url.pathname.startsWith("/api/search/hubcloud")) {
      type Hits = {
        file_name: string;
        mimeType: string;
        size: string;
        date: string;
        url: string;
      };

      type Hubcloud = {
        hits: Hits[];
        found: string;
        page: string;
        per_page: string;
        took_ms: string;
      };

      const rawQuery = url.searchParams.get("q") || "Friends s01e01 1080p";
      const encodedQuery = encodeURIComponent(rawQuery);
      const pageParam = url.searchParams.get("page") ?? "1";

      const HUBCLOUD_URL = `${env.HUBCLOUD}&q=${encodedQuery}&page=${pageParam}`;
      let upstreamData: Hubcloud;
      try {
        const res = await fetch(HUBCLOUD_URL);

        // 1. Check if the HTTP status is successful (e.g., 200 OK)
        if (!res.ok) {
          // Read the error page as text instead of JSON
          const errorText = await res.text();
          console.error(
            `Upstream failed with status ${res.status}:`,
            errorText.substring(0, 500),
          );

          return Response.json(
            {
              error: "Upstream API returned an error status",
              status: res.status,
              snippet: errorText.substring(0, 200), // Return a snippet of the HTML to help you debug
            },
            { status: res.status },
          );
        }

        // 2. Verify the Content-Type is actually JSON before parsing
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const rawText = await res.text();
          console.error(
            `Expected JSON but got ${contentType}. Body snippet:`,
            rawText.substring(0, 500),
          );

          return Response.json(
            {
              error: "Upstream API did not return JSON",
              contentType: contentType,
            },
            { status: 502 },
          ); // 502 Bad Gateway is a good fit here
        }

        // 3. Safe to parse
        upstreamData = await res.json();
      } catch (e) {
        const error = e as Error; // Typecast to Error if using TypeScript: e as Error
        console.error("Network or parsing error:", error);
        return Response.json(
          {
            name: error.name,
            message: error.message,
            cause: error.cause,
            stack: error.stack,
          },
          { status: 500 },
        );
      }

      const currentPage = Number(upstreamData.page);
      const pageSize = Number(upstreamData.per_page);
      const totalItems = Number(upstreamData.found);
      const totalPages = Math.ceil(totalItems / pageSize);

      const dataArray = upstreamData.hits.map((value) => {
        return {
          fileName: value.file_name,
          mimeType: value.mimeType,
          size: value.size,
          date: new Date(value.date.replace(/-/g, " ")).toISOString(),
          url: value.url,
        };
      });

      const standardResponse: StandardResponse = {
        data: dataArray,
        meta: {
          pagination: {
            currentPage,
            pageSize,
            totalItems,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
          },
          queryStats: {
            processingTimeMs: Number(upstreamData.took_ms),
          },
        },
      };

      return Response.json(standardResponse);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
