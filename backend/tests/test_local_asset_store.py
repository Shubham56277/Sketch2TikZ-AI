from app.storage import local_asset_store


def test_temporary_asset_round_trip():
    url = local_asset_store.put(b"%PDF-test", "application/pdf")
    token = url.rsplit("/", 1)[-1]
    assert local_asset_store.get(token) == (b"%PDF-test", "application/pdf")


def test_unknown_asset_returns_none():
    assert local_asset_store.get("does-not-exist") is None
