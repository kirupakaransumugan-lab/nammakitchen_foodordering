import math


# Cuts a query into pages and returns the numbers the frontend needs.
# page 1 = the first `limit` rows, page 2 = the next `limit` rows, ...
def paginate(query, page: int, limit: int) -> dict:
    total = query.count()

    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 0
    }
