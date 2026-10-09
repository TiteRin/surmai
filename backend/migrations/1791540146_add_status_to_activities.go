package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

		activities, err := app.FindCollectionByNameOrId("activities")
		if err != nil {
			return err
		}

		pos := len(activities.Fields)
		for i, f := range activities.Fields {
			if f.GetName() == "trip" {
				pos = i
				break
			}
		}

		activities.Fields.AddAt(
			pos,
			&core.SelectField{
				Name:      "status",
				Values:    []string{"draft", "planned"},
				MaxSelect: 1,
				Required:  true,
			})

		if err := app.Save(activities); err != nil {
			return err
		}

		_, err = app.DB().
			NewQuery("UPDATE activities SET status = 'planned' WHERE status = '' OR status IS NULL").
			Execute()

		return err
	}, func(app core.App) error {
		// add down queries...
		activities, err := app.FindCollectionByNameOrId("activities")
		if err != nil {
			return err
		}

		activities.Fields.RemoveByName("status")
		return app.Save(activities)
	})
}
