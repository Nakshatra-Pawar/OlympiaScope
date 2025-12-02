from typing import Iterable, List, Dict, Iterator, Optional, Callable, Any, Tuple
from collections import defaultdict

# ---------- MyCSVParser Class ----------
class MyCSVParser:
    def __init__(
        self,
        filename: str,
        sep: str = ",",
        chunk_size: Optional[int] = None,
        encoding: str = "utf-8",
    ):
        self.filename = filename
        self.sep = sep
        self.chunk_size = chunk_size
        self.encoding = encoding
        self._headers: List[str] = []

    # ---- public APIs ----
    def headers(self) -> List[str]:
        if self._headers:
            return self._headers
        with open(self.filename, "r", encoding=self.encoding, newline="") as f:
            first = self._readline(f)
            self._headers = self._parse_line(first)
            if self._headers and isinstance(self._headers[0], str):
                self._headers[0] = self._headers[0].lstrip("\ufeff")
        return self._headers

    def _readline(self, f) -> str:
        line = f.readline()
        if not line:
            raise ValueError("Empty file or missing header")
        return self._strip_newline(line)

    # CSV line parser supporting quotes and escaped quotes ("")
    def _parse_line(self, line: str) -> List[str]:
        out, cur, in_quotes = [], [], False
        i, L = 0, len(line)
        while i < L:
            ch = line[i]
            if in_quotes:
                if ch == '"':
                    # escaped quote ("")
                    if i + 1 < L and line[i + 1] == '"':
                        cur.append('"')
                        i += 2
                        continue
                    else:
                        in_quotes = False
                        i += 1
                        continue
                else:
                    cur.append(ch)
                    i += 1
                    continue
            else:
                if ch == '"':
                    in_quotes = True
                    i += 1
                    continue
                if ch == self.sep:
                    out.append("".join(cur))
                    cur = []
                    i += 1
                    continue
                else:
                    cur.append(ch)
                    i += 1
                    continue
        out.append("".join(cur))
        return out

    def _strip_newline(self, s: str) -> str:
        if s.endswith("\r\n"):
            return s[:-2]
        if s.endswith("\n") or s.endswith("\r"):
            return s[:-1]
        return s

    def _iter_data_lines(self, f) -> Iterator[str]:
        for line in f:
            yield self._strip_newline(line)

    def iter_rows(self) -> Iterator[Dict[str, Any]]:
        with open(self.filename, "r", encoding=self.encoding, newline="") as f:
            header = self._parse_line(self._readline(f))
            if header and isinstance(header[0], str):
                header[0] = header[0].lstrip("\ufeff")  
            converters = [self._make_converter() for _ in header]
            for raw in self._iter_data_lines(f):
                fields = self._parse_line(raw)
                fields = self._pad_or_trim(fields, len(header))
                row = [self._convert(fields[i], converters[i]) for i in range(len(header))]
                yield {header[i]: row[i] for i in range(len(header))}

    def __iter__(self):
        return self.iter_rows() if not self.chunk_size else self.iter_chunks()

    def _pad_or_trim(self, fields: List[str], target: int) -> List[str]:
        if len(fields) < target:
            return fields + [""] * (target - len(fields))
        if len(fields) > target:
            return fields[:target]
        return fields

    def _make_converter(self) -> Callable[[str], Any]:
        # returns a stateful converter that promotes types as needed
        inferred: List[Callable[[str], Any]] = [
            self._to_int,
            self._to_float,
            self._to_bool,
            self._to_none,
            self._identity,
        ]
        chosen: Optional[Callable[[str], Any]] = None

        def conv(s: str) -> Any:
            nonlocal chosen
            if chosen is not None:
                return chosen(s)
            for fn in inferred:
                try:
                    v = fn(s)
                    if v is not None or s.strip() != "":
                        chosen = fn
                    return v
                except Exception:
                    continue
            chosen = self._identity
            return s

        return conv

    def _convert(self, s: str, conv: Callable[[str], Any]) -> Any:
        stripped = s.strip()
        if stripped == "" or stripped.lower() in {"na", "null", "none"}:
            return None 
        try:
            return conv(s)
        except Exception:
            return None

    # primitive parsers
    def _to_none(self, s: str) -> Any:
        if s.strip() == "" or s.strip().lower() in {"na", "null", "none"}:
            return None
        raise ValueError

    def _to_bool(self, s: str) -> Any:
        t = s.strip().lower()
        if t in {"true", "t", "yes", "y", "1"}:
            return True
        if t in {"false", "f", "no", "n", "0"}:
            return False
        raise ValueError

    def _to_int(self, s: str) -> Any:
        t = s.strip().replace("_", "").replace(",", "")
        if t == "":
            raise ValueError
        # allow signs
        if t[0] in "+-" and t[1:].isdigit():
            return int(t)
        if t.isdigit():
            return int(t)
        raise ValueError

    def _to_float(self, s: str) -> Any:
        t = s.strip().replace("_", "").replace(",", "")
        if t == "" or t in {"+", "-"}:
            raise ValueError
        if t.isdigit() or (t[0] in "+-" and t[1:].isdigit()):
            raise ValueError
        try:
            return float(t)
        except Exception as e:
            raise ValueError from e

    def _identity(self, s: str) -> str:
        return s

    def iter_chunks(self) -> Iterator[List[Dict[str, Any]]]:
        with open(self.filename, "r", encoding=self.encoding, newline="") as f:
            header = self._parse_line(self._readline(f))
            if header and isinstance(header[0], str):
                header[0] = header[0].lstrip("\ufeff")
            converters = [self._make_converter() for _ in header]
            buf: List[Dict[str, Any]] = []
            for raw in self._iter_data_lines(f):
                fields = self._parse_line(raw)
                fields = self._pad_or_trim(fields, len(header))
                row = [self._convert(fields[i], converters[i]) for i in range(len(header))]
                buf.append({header[i]: row[i] for i in range(len(header))})
                if self.chunk_size and len(buf) >= self.chunk_size:
                    yield buf
                    buf = []
            if buf:
                yield buf


# ---------- MyDataFrame Class ----------
class MyDataFrame:
    def __init__(self, columns: Dict[str, List[Any]]):
        if not columns:
            self._cols: Dict[str, List[Any]] = {}
            self._n = 0
            return
        lens = {len(v) for v in columns.values()}
        if len(lens) > 1:
            raise ValueError("All columns must have equal length")
        self._cols = {k: list(v) for k, v in columns.items()}
        self._n = next(iter(lens))

    # ---------- construction & basics ----------
    @classmethod
    def from_rows(cls, rows: Iterable[Dict[str, Any]]) -> "MyDataFrame":
        cols: Dict[str, List[Any]] = {}
        initialized = False
        order: List[str] = []
        for r in rows:
            if not initialized:
                order = list(r.keys())
                cols = {k: [] for k in order}
                initialized = True
            for k in order:
                cols[k].append(r.get(k))
        return cls(cols)

    def nrows(self) -> int:
        return self._n

    def ncols(self) -> int:
        return len(self._cols)

    def columns(self) -> List[str]:
        return list(self._cols.keys())

    def get_col(self, name: str) -> List[Any]:
        return self._cols[name]

    def iter_rows(self) -> Iterable[Dict[str, Any]]:
        keys = self.columns()
        for i in range(self._n):
            yield {k: self._cols[k][i] for k in keys}

    # ---------- core ops (single-frame) ----------

    def project(self, cols: List[str]) -> "MyDataFrame":
        return MyDataFrame({c: self._cols[c][:] for c in cols})

    def filter(self, cond_func: Callable[[Dict[str, Any]], bool]) -> "MyDataFrame":
        keys = self.columns()
        out: Dict[str, List[Any]] = {k: [] for k in keys}
        for i in range(self._n):
            row = {k: self._cols[k][i] for k in keys}
            if cond_func(row):
                for k in keys:
                    out[k].append(self._cols[k][i])
        return MyDataFrame(out)

    def limit(self, n: int) -> "MyDataFrame":
        out_cols = {k: v[:n] for k, v in self._cols.items()}
        return MyDataFrame(out_cols)

    def offset(self, m: int) -> "MyDataFrame":
        out_cols = {k: v[m:] for k, v in self._cols.items()}
        return MyDataFrame(out_cols)

    def head(self, n: int = 5) -> "MyDataFrame":
        out_cols = {k: v[:n] for k, v in self._cols.items()}
        return MyDataFrame(out_cols)

    def tail(self, n: int = 5) -> "MyDataFrame":
        out_cols = {k: v[-n:] if n != 0 else [] for k, v in self._cols.items()}
        return MyDataFrame(out_cols)

    def order_by(self, columns: List[Tuple[str, str]]) -> "MyDataFrame":
        if not columns:
            return self

        keys = self.columns()
        data_rows = [tuple(self._cols[k][i] for k in keys) for i in range(self._n)]

        class SortWrapper:

            def __init__(self, value):
                self.value = value

            def __lt__(self, other):
                return self.value > other.value

            def __eq__(self, other):
                return self.value == other.value

        def sort_key(row):
            result = []
            for col, direction in columns:
                val = row[keys.index(col)]
                result.append(val if direction.lower() == "asc" else SortWrapper(val))
            return result

        sorted_rows = sorted(data_rows, key=sort_key)
        sorted_cols = {k: [] for k in keys}
        for row in sorted_rows:
            for i, k in enumerate(keys):
                sorted_cols[k].append(row[i])

        return MyDataFrame(sorted_cols)

    def group_by(self, keys, agg_spec: Dict[str, str]) -> "MyDataFrame":
        if isinstance(keys, str):
            keys = [keys]

        state: Dict[Tuple[Any, ...], Dict[Tuple[str, str], Any]] = {}

        def init_state():
            s: Dict[Tuple[str, str], Any] = {}
            for col, agg in agg_spec.items():
                if agg == "avg":
                    s[(col, "sum")] = 0.0
                    s[(col, "count")] = 0
                elif agg == "sum":
                    s[(col, "sum")] = 0.0
                elif agg == "min":
                    s[(col, "min")] = None
                elif agg == "max":
                    s[(col, "max")] = None
                elif agg == "count":
                    s[(col, "count")] = 0
                elif agg == "count_col":
                    s[(col, "count_col")] = 0
                else:
                    raise ValueError(f"Unsupported agg: {agg}")
            return s

        def update(s, i):
            for col, agg in agg_spec.items():
                v = self._cols[col][i]

                if agg == "sum":
                    s[(col, "sum")] += (v if v is not None else 0)

                elif agg == "min":
                    cur = s[(col, "min")]
                    if cur is None:
                        s[(col, "min")] = v
                    elif v is not None and v < cur:
                        s[(col, "min")] = v

                elif agg == "max":
                    cur = s[(col, "max")]
                    if cur is None:
                        s[(col, "max")] = v
                    elif v is not None and v > cur:
                        s[(col, "max")] = v

                elif agg == "count":
                    s[(col, "count")] += 1

                elif agg == "count_col":
                    if v is not None:
                        s[(col, "count_col")] += 1

                elif agg == "avg":
                    if v is not None:
                        s[(col, "sum")] += v
                        s[(col, "count")] += 1

        for i in range(self._n):
            ktuple = tuple(self._cols[k][i] for k in keys)
            s = state.get(ktuple)
            if s is None:
                s = init_state()
                state[ktuple] = s
            update(s, i)

        out_cols: Dict[str, List[Any]] = {k: [] for k in keys}
        output_specs: List[Tuple[str, str, str]] = []

        for col, agg in agg_spec.items():
            if agg == "sum":
                name = f"sum_{col}"
            elif agg == "min":
                name = f"min_{col}"
            elif agg == "max":
                name = f"max_{col}"
            elif agg == "count":
                name = "count_all"
            elif agg == "count_col":
                name = f"count_{col}"
            elif agg == "avg":
                name = f"avg_{col}"
            else:
                raise ValueError(f"Unsupported agg: {agg}")

            output_specs.append((col, agg, name))
            out_cols[name] = []

        for ktuple, s in state.items():
            for j, k in enumerate(keys):
                out_cols[k].append(ktuple[j])

            for col, agg, name in output_specs:
                if agg == "sum":
                    val = s[(col, "sum")]
                elif agg == "min":
                    val = s[(col, "min")]
                elif agg == "max":
                    val = s[(col, "max")]
                elif agg == "count":
                    val = s[(col, "count")]
                elif agg == "count_col":
                    val = s[(col, "count_col")]
                elif agg == "avg":
                    c = s[(col, "count")]
                    val = (s[(col, "sum")] / c) if c > 0 else None
                out_cols[name].append(val)

        return MyDataFrame(out_cols)

    def join(
        self,
        other: "MyDataFrame",
        on_key: str,
        how: str = "inner",
        suffixes: Tuple[str, str] = ("_x", "_y"),
    ) -> "MyDataFrame":
        if on_key not in self._cols or on_key not in other._cols:
            raise KeyError(f"join key '{on_key}' missing in one of the DataFrames")

        right_index: Dict[Any, List[int]] = defaultdict(list)
        right_cols = other.columns()

        for j in range(other._n):
            key_val = other._cols[on_key][j]
            right_index[key_val].append(j)

        left_cols = self.columns()
        right_nonkey = [c for c in right_cols if c != on_key]

        out_cols: Dict[str, List[Any]] = {}
        for c in left_cols:
            out_cols[c] = []
        for c in right_nonkey:
            name = c if c not in left_cols else c + suffixes[1]
            out_cols[name] = []

        # left side rows
        for i in range(self._n):
            lk = self._cols[on_key][i]
            matches = right_index.get(lk)

            if matches:
                for j in matches:
                    for c in left_cols:
                        out_cols[c].append(self._cols[c][i])
                    for c in right_nonkey:
                        name = c if c not in left_cols else c + suffixes[1]
                        out_cols[name].append(other._cols[c][j])
            elif how == "left":
                for c in left_cols:
                    out_cols[c].append(self._cols[c][i])
                for c in right_nonkey:
                    name = c if c not in left_cols else c + suffixes[1]
                    out_cols[name].append(None)

        if how == "right":
            left_key_vals = set(self._cols[on_key])
            for key_val, idxs in right_index.items():
                if key_val not in left_key_vals:
                    for j in idxs:
                        for c in left_cols:
                            out_cols[c].append(None)
                        for c in right_nonkey:
                            name = c if c not in left_cols else c + suffixes[1]
                            out_cols[name].append(other._cols[c][j])

        return MyDataFrame(out_cols)

#for chunk size
def group_by_streaming(
    parser: MyCSVParser,
    keys,
    agg_spec: Dict[str, str],
) -> MyDataFrame:
    if isinstance(keys, str):
        keys = [keys]

    state: Dict[Tuple[Any, ...], Dict[Tuple[str, str], Any]] = {}

    def init_state() -> Dict[Tuple[str, str], Any]:
        s: Dict[Tuple[str, str], Any] = {}
        for col, agg in agg_spec.items():
            if agg == "avg":
                s[(col, "sum")] = 0.0
                s[(col, "count")] = 0
            elif agg == "sum":
                s[(col, "sum")] = 0.0
            elif agg == "min":
                s[(col, "min")] = None
            elif agg == "max":
                s[(col, "max")] = None
            elif agg == "count":
                s[(col, "count")] = 0
            elif agg == "count_col":
                s[(col, "count_col")] = 0
            else:
                raise ValueError(f"Unsupported agg: {agg}")
        return s

    def update_state_for_chunk(chunk_df: MyDataFrame) -> None:
        for i in range(chunk_df.nrows()):
            group_key = tuple(chunk_df._cols[k][i] for k in keys)
            s = state.get(group_key)
            if s is None:
                s = init_state()
                state[group_key] = s

            for col, agg in agg_spec.items():
                v = chunk_df._cols[col][i]

                if agg == "sum":
                    s[(col, "sum")] += (v if v is not None else 0)

                elif agg == "min":
                    cur = s[(col, "min")]
                    if cur is None:
                        s[(col, "min")] = v
                    elif v is not None and v < cur:
                        s[(col, "min")] = v

                elif agg == "max":
                    cur = s[(col, "max")]
                    if cur is None:
                        s[(col, "max")] = v
                    elif v is not None and v > cur:
                        s[(col, "max")] = v

                elif agg == "count":
                    s[(col, "count")] += 1

                elif agg == "count_col":
                    if v is not None:
                        s[(col, "count_col")] += 1

                elif agg == "avg":
                    if v is not None:
                        s[(col, "sum")] += v
                        s[(col, "count")] += 1

    # stream all chunks
    for chunk_rows in parser.iter_chunks():
        if not chunk_rows:
            continue
        chunk_df = MyDataFrame.from_rows(chunk_rows)
        update_state_for_chunk(chunk_df)

    # finalize state into output dataframe
    out_cols: Dict[str, List[Any]] = {k: [] for k in keys}
    output_specs: List[Tuple[str, str, str]] = []

    for col, agg in agg_spec.items():
        if agg == "sum":
            name = f"sum_{col}"
        elif agg == "min":
            name = f"min_{col}"
        elif agg == "max":
            name = f"max_{col}"
        elif agg == "count":
            name = "count_all"
        elif agg == "count_col":
            name = f"count_{col}"
        elif agg == "avg":
            name = f"avg_{col}"
        else:
            raise ValueError(f"Unsupported agg: {agg}")

        output_specs.append((col, agg, name))
        out_cols[name] = []

    for group_key, s in state.items():
        for j, k in enumerate(keys):
            out_cols[k].append(group_key[j])

        for col, agg, name in output_specs:
            if agg == "sum":
                val = s[(col, "sum")]
            elif agg == "min":
                val = s[(col, "min")]
            elif agg == "max":
                val = s[(col, "max")]
            elif agg == "count":
                val = s[(col, "count")]
            elif agg == "count_col":
                val = s[(col, "count_col")]
            elif agg == "avg":
                c = s[(col, "count")]
                val = (s[(col, "sum")] / c) if c > 0 else None
            out_cols[name].append(val)

    return MyDataFrame(out_cols)


def group_by_streaming_csv(
    filename: str,
    keys,
    agg_spec: Dict[str, str],
    sep: str = ",",
    chunk_size: int = 50_000,
    encoding: str = "utf-8",
) -> MyDataFrame:
    parser = MyCSVParser(filename, sep=sep, chunk_size=chunk_size, encoding=encoding)
    return group_by_streaming(parser, keys, agg_spec)


def iter_filter_project_streaming(
    parser: MyCSVParser,
    cond_func: Optional[Callable[[Dict[str, Any]], bool]] = None,
    project_cols: Optional[List[str]] = None,
) -> Iterable[Dict[str, Any]]:
    if cond_func is None:
        def cond_func(row: Dict[str, Any]) -> bool: 
            return True

    for chunk_rows in parser.iter_chunks():
        if not chunk_rows:
            continue

        df_chunk = MyDataFrame.from_rows(chunk_rows)

        if cond_func is not None:
            df_chunk = df_chunk.filter(cond_func)

        if project_cols is not None:
            df_chunk = df_chunk.project(project_cols)

        for row in df_chunk.iter_rows():
            yield row


def filter_project_streaming_to_df(
    parser: MyCSVParser,
    cond_func: Optional[Callable[[Dict[str, Any]], bool]] = None,
    project_cols: Optional[List[str]] = None,
) -> MyDataFrame:
    rows = iter_filter_project_streaming(parser, cond_func=cond_func, project_cols=project_cols)
    return MyDataFrame.from_rows(rows)


def filter_project_streaming_csv(
    filename: str,
    cond_func: Optional[Callable[[Dict[str, Any]], bool]] = None,
    project_cols: Optional[List[str]] = None,
    sep: str = ",",
    chunk_size: int = 50_000,
    encoding: str = "utf-8",
) -> MyDataFrame:
    parser = MyCSVParser(filename, sep=sep, chunk_size=chunk_size, encoding=encoding)
    return filter_project_streaming_to_df(parser, cond_func=cond_func, project_cols=project_cols)


def iter_join_streaming_small_big(
    big_parser: MyCSVParser,
    small_df: MyDataFrame,
    on_key: str,
    how: str = "inner",
    suffixes: Tuple[str, str] = ("_big", "_small"),
) -> Iterable[Dict[str, Any]]:
    if on_key not in small_df.columns():
        raise KeyError(f"join key '{on_key}' not found in small_df")

    if how not in ("inner", "left"):
        raise ValueError("iter_join_streaming_small_big supports 'inner' and 'left' only")

    right_cols = small_df.columns()
    right_index: Dict[Any, List[int]] = defaultdict(list)
    for j in range(small_df.nrows()):
        key_val = small_df._cols[on_key][j]
        right_index[key_val].append(j)

    right_nonkey = [c for c in right_cols if c != on_key]
    left_cols: Optional[List[str]] = None

    for chunk_rows in big_parser.iter_chunks():
        if not chunk_rows:
            continue

        df_big = MyDataFrame.from_rows(chunk_rows)

        if on_key not in df_big.columns():
            raise KeyError(f"join key '{on_key}' not found in big (chunk) DataFrame")

        if left_cols is None:
            left_cols = df_big.columns()

        for i in range(df_big.nrows()):
            key_val = df_big._cols[on_key][i]
            matches = right_index.get(key_val)

            if matches:
                for j in matches:
                    out_row: Dict[str, Any] = {}
                    for c in left_cols:
                        out_row[c] = df_big._cols[c][i]
                    for c in right_nonkey:
                        name = c if c not in left_cols else c + suffixes[1]
                        out_row[name] = small_df._cols[c][j]
                    yield out_row
            elif how == "left":
                out_row = {}
                for c in left_cols:
                    out_row[c] = df_big._cols[c][i]
                for c in right_nonkey:
                    name = c if c not in left_cols else c + suffixes[1]
                    out_row[name] = None
                yield out_row


def join_streaming_small_big_to_df(
    big_parser: MyCSVParser,
    small_df: MyDataFrame,
    on_key: str,
    how: str = "inner",
    suffixes: Tuple[str, str] = ("_big", "_small"),
) -> MyDataFrame:
    rows = iter_join_streaming_small_big(
        big_parser=big_parser,
        small_df=small_df,
        on_key=on_key,
        how=how,
        suffixes=suffixes,
    )
    return MyDataFrame.from_rows(rows)


def join_streaming_small_big_csv(
    small_filename: str,
    big_filename: str,
    on_key: str,
    how: str = "inner",
    sep: str = ",",
    small_encoding: str = "utf-8",
    big_encoding: str = "utf-8",
    big_chunk_size: int = 50_000,
    suffixes: Tuple[str, str] = ("_big", "_small"),
) -> MyDataFrame:
    small_parser = MyCSVParser(small_filename, sep=sep, chunk_size=None, encoding=small_encoding)
    small_df = MyDataFrame.from_rows(small_parser.iter_rows())

    big_parser = MyCSVParser(big_filename, sep=sep, chunk_size=big_chunk_size, encoding=big_encoding)

    return join_streaming_small_big_to_df(
        big_parser=big_parser,
        small_df=small_df,
        on_key=on_key,
        how=how,
        suffixes=suffixes,
    )


def iter_order_by_streaming(
    parser: MyCSVParser,
    by: str,
    reverse: bool = False,
) -> Iterator[Dict[str, Any]]:
    for chunk_rows in parser.iter_chunks():
        if not chunk_rows:
            continue
        sorted_rows = sorted(chunk_rows, key=lambda row: row.get(by), reverse=reverse)
        for row in sorted_rows:
            yield row


def order_by_streaming_to_df(
    parser: MyCSVParser,
    by: str,
    reverse: bool = False,
) -> MyDataFrame:
    rows = iter_order_by_streaming(parser, by=by, reverse=reverse)
    return MyDataFrame.from_rows(rows)


#GDP & Population analytics

EVENTS_CSV = "events.csv"
NOC_COUNTRYCODE_CSV = "noc_to_countrycode.csv"
COUNTRY_YEAR_STATS_CSV = "country_year_stats.csv"


def load_noc_countrycode_df() -> MyDataFrame:
    parser = MyCSVParser(NOC_COUNTRYCODE_CSV)
    return MyDataFrame.from_rows(parser.iter_rows())


def load_country_year_stats_df() -> MyDataFrame:
    parser = MyCSVParser(COUNTRY_YEAR_STATS_CSV)
    return MyDataFrame.from_rows(parser.iter_rows())


def medals_per_noc_year_streaming(
    events_csv: str = EVENTS_CSV,
    chunk_size: int = 50_000,
    season: Optional[str] = None,         
    medal_filter: Optional[str] = None,   
) -> MyDataFrame:
    parser = MyCSVParser(events_csv, chunk_size=chunk_size)

    counts: Dict[Tuple[str, int], int] = {}

    for chunk in parser.iter_chunks():
        for row in chunk:
            medal = row["Medal"]
            if medal is None:
                continue
            if medal_filter is not None and medal != medal_filter:
                continue
            if season is not None and row["Season"] != season:
                continue

            key = (row["NOC"], row["Year"])
            counts[key] = counts.get(key, 0) + 1

    rows: List[Dict[str, Any]] = []
    for (noc, year), cnt in counts.items():
        rows.append(
            {
                "NOC": noc,
                "Year": year,
                "medal_count": cnt,
            }
        )

    return MyDataFrame.from_rows(rows)

def country_medals_with_stats(
    season: Optional[str] = None,
    medal_filter: Optional[str] = None,
) -> MyDataFrame:
    medals_df = medals_per_noc_year_streaming(
        events_csv=EVENTS_CSV,
        chunk_size=50_000,
        season=season,
        medal_filter=medal_filter,
    )

    noc_map_df = load_noc_countrycode_df()

    medals_with_codes = medals_df.join(
        noc_map_df,
        on_key="NOC",
        how="left",
        suffixes=("_medals", "_noc"),
    )

    stats_df = load_country_year_stats_df()

    def add_cc_year_key(df: MyDataFrame) -> MyDataFrame:
        rows: List[Dict[str, Any]] = []
        for row in df.iter_rows():
            cc = row["Country Code"]
            year = row["Year"]
            if cc is None or year is None:
                continue
            new_row = dict(row)
            new_row["CC_Year"] = f"{cc}_{year}"
            rows.append(new_row)
        return MyDataFrame.from_rows(rows)

    medals_keyed = add_cc_year_key(medals_with_codes)
    stats_keyed = add_cc_year_key(stats_df)

    joined = medals_keyed.join(
        stats_keyed,
        on_key="CC_Year",
        how="left",
        suffixes=("_medals", "_stats"),
    )

    return joined


def medals_efficiency_for_year(
    year: int,
    season: Optional[str] = None,
    medal_filter: Optional[str] = None,
) -> MyDataFrame:
    joined = country_medals_with_stats(season=season, medal_filter=medal_filter)

    def cond(row: Dict[str, Any]) -> bool:
        return row["Year"] == year

    year_df = joined.filter(cond)

    rows: List[Dict[str, Any]] = []
    for row in year_df.iter_rows():
        pop = row["Population"]
        gdp = row["GDP_USD"]
        medal_count = row["medal_count"]

        if pop is None or pop == 0 or gdp is None or gdp == 0:
            continue

        medals_per_million = medal_count / (pop / 1_000_000.0)
        medals_per_billion_gdp = medal_count / (gdp / 1_000_000_000.0)

        new_row = dict(row)
        new_row["medals_per_million"] = medals_per_million
        new_row["medals_per_billion_gdp"] = medals_per_billion_gdp
        rows.append(new_row)

    result_df = MyDataFrame.from_rows(rows)
    result_sorted = result_df.order_by([("medals_per_million", "desc")])
    return result_sorted
