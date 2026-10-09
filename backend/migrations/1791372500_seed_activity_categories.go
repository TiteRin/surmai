package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("activity_categories")
		if err != nil {
			return err
		}

		categories := []struct{ key, name, emoji, color string }{
		    {"coffee", "Coffee", "☕", "yellow"},
		    {"restaurant", "Restaurant", "🍽️", "grape"},
		    {"shopping", "Shopping", "🛍️", "violet"},
		    {"sightseeing", "Sightseeing", "🏞️", "blue"},
		    {"museum", "Museum", "🖼️", "orange"},
		    {"outdoors", "Outdoors", "🌲", "green"},
		    {"hike", "Hike", "🥾", "lime"},
		    {"wellness", "Wellness", "🪷️", "pink"},
		}

		for i, c := range categories {
			// skip existing keys so the migration can be re-run safely
			if _, err := app.FindFirstRecordByData(collection, "key", c.key); err == nil {
				continue
			}
			record := core.NewRecord(collection)
			record.Set("key", c.key)
			record.Set("name", c.name)
			record.Set("emoji", c.emoji)
			record.Set("color", c.color)
			record.Set("order", i+1)
			if err := app.Save(record); err != nil {
				return err
			}
		}
		return nil
	}, func(app core.App) error {
		return nil
	})
}
