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
        upstreamData = await res.json();
      } catch (e) {
        const error = e as Error;
        console.error(error);
        return Response.json({name:error.name, message: error.message , cause:error.cause , stack: error.stack});
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
