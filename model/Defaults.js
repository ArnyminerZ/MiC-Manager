export const InsertDefaultRole = `INSERT INTO FilaMagenta.mRoles (Id, DisplayName)
                                  SELECT 1, 'default'
                                  FROM DUAL
                                  WHERE NOT EXISTS(SELECT * FROM FilaMagenta.mRoles WHERE Id = 1 and DisplayName = 'DEFAULT');`;
